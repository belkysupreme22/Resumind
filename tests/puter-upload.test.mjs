import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { deployToPuter, isMissingResource, resolveReleasePath } from '../scripts/deploy-puter.mjs';

const releasePath = `~/Sites/resumind/releases/${'a'.repeat(40)}/123-1`;
const missing = () => ({ error: 'Subject does not exist', message: 'Subject does not exist', code: 'subject_does_not_exist' });

async function fixture(t) {
  const sourcePath = await mkdtemp(path.join(tmpdir(), 'resumind-upload-'));
  t.after(() => rm(sourcePath, { recursive: true, force: true }));
  await mkdir(path.join(sourcePath, 'assets'));
  await writeFile(path.join(sourcePath, 'index.html'), 'site');
  await writeFile(path.join(sourcePath, '.puter_site_config'), 'routing');
  await writeFile(path.join(sourcePath, 'assets/entry.js'), 'entry');
  const calls = [];
  let directoryExists = false;
  const puter = {
    auth: { getUser: async () => { calls.push(['auth']); return { username: 'alice' }; } },
    fs: {
      stat: async (directory) => { calls.push(['stat', directory]); if (!directoryExists) throw missing(); return { uid: 'release-folder', is_dir: true }; },
      mkdir: async (directory, options) => { calls.push(['mkdir', directory, options]); directoryExists = true; return { uid: 'release-folder', is_dir: true }; },
      write: async (file, data, options) => { calls.push(['write', file, data.toString(), options]); return { uid: file, path: file }; },
    },
    hosting: {
      get: async () => { calls.push(['get-site']); throw { code: 'forbidden' }; },
      list: async () => { calls.push(['list-sites']); return []; },
      create: async (subdomain, directory) => { calls.push(['create-site', subdomain, directory]); return { subdomain }; },
      update: async (subdomain, directory) => { calls.push(['update-site', subdomain, directory]); return { subdomain }; },
    },
  };
  const run = (options = {}) => deployToPuter({ puter, subdomain: 'resumind', releasePath, sourcePath, verify: async () => { calls.push(['verify']); }, log: () => {}, ...options });
  return { puter, calls, run };
}

test('first deployment works when a named website lookup would be forbidden and the release folder is missing', async (t) => {
  const { calls, run } = await fixture(t);
  const result = await run();
  const writes = calls.filter(([operation]) => operation === 'write');
  assert.equal(result.deploymentUrl, 'https://resumind.puter.site');
  assert.equal(result.releasePath, `/alice/${releasePath.slice(2)}`);
  assert.equal(result.deployedFiles, 3);
  assert.equal(calls.filter(([operation]) => operation === 'mkdir').length, 1);
  assert.equal(calls.filter(([operation]) => operation === 'list-sites').length, 1);
  assert.equal(calls.some(([operation]) => operation === 'get-site'), false);
  assert.equal(writes.length, 3);
  assert.ok(writes.some(([, name]) => name.endsWith('/.puter_site_config')));
  assert.ok(writes.every(([, name, , options]) => name.startsWith('/alice/Sites/') && options.createMissingParents && options.overwrite && options.dedupeName === false));
  assert.equal(calls.at(-1)[0], 'create-site');
});

test('an existing website is repointed only after every upload finishes', async (t) => {
  const { puter, calls, run } = await fixture(t);
  puter.hosting.list = async () => [
    { subdomain: 'another-site', root_dir: { uid: 'unrelated-folder' } },
    { subdomain: 'resumind', root_dir: { uid: 'previous-folder' } },
  ];
  const write = puter.fs.write;
  puter.fs.write = async (...args) => { const result = await write(...args); calls.push(['upload-complete']); return result; };
  await run();
  assert.equal(calls.filter(([operation]) => operation === 'upload-complete').length, 3);
  assert.equal(calls.at(-1)[0], 'update-site');
  assert.equal(calls.filter(([operation]) => operation === 'create-site').length, 0);
});

test('a failed upload leaves the current website binding untouched', async (t) => {
  const { puter, calls, run } = await fixture(t);
  puter.hosting.list = async () => [{ subdomain: 'resumind', root_dir: { uid: 'previous-folder' } }];
  puter.fs.write = async () => { throw { code: 'storage_limit_reached' }; };
  await assert.rejects(run(), /Uploading 3 release files failed \(storage_limit_reached\)/);
  assert.equal(calls.some(([operation]) => ['create-site', 'update-site'].includes(operation)), false);
});

test('permission failures are not treated as missing folders', async (t) => {
  const { puter, calls, run } = await fixture(t);
  puter.fs.stat = async () => { throw { code: 'permission_denied' }; };
  await assert.rejects(run(), /Preparing release directory failed \(permission_denied\)/);
  assert.equal(calls.some(([operation]) => ['mkdir', 'write', 'create-site', 'update-site'].includes(operation)), false);
});

test('a forbidden website list stops before any filesystem or hosting mutation', async (t) => {
  const { puter, calls, run } = await fixture(t);
  puter.hosting.list = async () => { throw { code: 'forbidden', request: { token: 'sensitive-example' } }; };
  await assert.rejects(run(), (error) => error.message.includes('Listing accessible websites failed (forbidden)') && !error.message.includes('sensitive-example'));
  assert.equal(calls.some(([operation]) => ['stat', 'mkdir', 'write', 'create-site', 'update-site'].includes(operation)), false);
});

test('an invalid website list stops rather than attempting to create a site', async (t) => {
  const { puter, calls, run } = await fixture(t);
  puter.hosting.list = async () => ({ error: { code: 'forbidden' } });
  await assert.rejects(run(), /Listing accessible websites failed/);
  assert.equal(calls.some(([operation]) => ['stat', 'mkdir', 'write', 'create-site', 'update-site'].includes(operation)), false);
});

test('a name absent from accessible websites is never updated when creation is denied', async (t) => {
  const { puter, calls, run } = await fixture(t);
  puter.hosting.list = async () => [{ subdomain: 'another-site' }];
  puter.hosting.create = async () => { calls.push(['create-site']); throw { code: 'forbidden' }; };
  await assert.rejects(run(), (error) => error.message.includes('Creating website binding failed (forbidden)') && error.message.includes('owner\'s account API token or choose another PUTER_SUBDOMAIN'));
  assert.equal(calls.filter(([operation]) => operation === 'create-site').length, 1);
  assert.equal(calls.some(([operation]) => operation === 'update-site'), false);
});

test('a website name conflict gives an account or subdomain remedy without changing any existing binding', async (t) => {
  const { puter, calls, run } = await fixture(t);
  puter.hosting.create = async () => { throw { code: 'conflict', request: { token: 'sensitive-example' } }; };
  await assert.rejects(run(), (error) => error.message.includes('Creating website binding failed (conflict)') && error.message.includes('PUTER_SUBDOMAIN') && !error.message.includes('sensitive-example'));
  assert.equal(calls.some(([operation]) => operation === 'update-site'), false);
});

test('invalid credentials fail before filesystem or hosting mutations', async (t) => {
  const { puter, calls, run } = await fixture(t);
  puter.auth.getUser = async () => { throw { code: 'token_expired', request: { token: 'sensitive-example' } }; };
  await assert.rejects(run(), (error) => error.message.includes('token_expired') && !error.message.includes('sensitive-example'));
  assert.equal(calls.some(([operation]) => ['mkdir', 'write', 'create-site', 'update-site'].includes(operation)), false);
});

test('build verification fails before calling Puter', async (t) => {
  const { calls, run } = await fixture(t);
  await assert.rejects(run({ verify: async () => { throw Error('Incomplete build'); } }), /Incomplete build/);
  assert.deepEqual(calls, []);
});

test('nested missing-resource errors are recognized, and explicit permission codes stay errors', () => {
  assert.equal(isMissingResource(missing()), true);
  assert.equal(isMissingResource({ error: { code: 'subject_does_not_exist' } }), true);
  assert.equal(isMissingResource({ code: 'entity_not_found' }), true);
  assert.equal(isMissingResource({ status: 404 }), true);
  assert.equal(isMissingResource({ code: 'permission_denied', status: 404 }), false);
  assert.equal(isMissingResource({ code: 'token_expired' }), false);
});

test('release paths are expanded using the authenticated account and cannot escape the release root', () => {
  assert.equal(resolveReleasePath(releasePath, 'alice'), `/alice/${releasePath.slice(2)}`);
  assert.throws(() => resolveReleasePath('~/other-folder', 'alice'), /release path/);
  assert.throws(() => resolveReleasePath(releasePath, '../other-account'), /username/);
});
