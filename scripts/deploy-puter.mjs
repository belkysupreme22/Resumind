import { appendFile, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deploymentConfig } from './puter-deploy-config.mjs';
import { verifyBuild } from './verify-build.mjs';

const missingCodes = new Set(['subject_does_not_exist', 'entity_not_found', 'not_found', 'ENOENT']);
const existsCodes = new Set(['already_exists', 'entity_exists', 'file_exists', 'directory_exists', 'item_with_same_name_exists']);
const errorCode = (error) => error?.error?.code ?? error?.code;

export const isMissingResource = (error) => {
  const code = errorCode(error);
  return code ? missingCodes.has(code) : (error?.error?.status ?? error?.status) === 404;
};

export function resolveReleasePath(releasePath, username) {
  if (typeof username !== 'string' || !username || /[\\/]/.test(username) || username === '.' || username === '..') throw new Error('Puter did not return a valid account username.');
  if (!/^~\/Sites\/resumind\/releases\/[a-f0-9]{40}\/\d+-\d+$/.test(releasePath)) throw new Error('Invalid versioned release path.');
  return `/${username}/${releasePath.slice(2)}`;
}

export async function createPuterClient(token) {
  if (!token?.trim()) throw new Error('Puter deployment token is required.');
  const { init } = await import('@heyputer/puter.js/src/init.cjs');
  const puter = init();
  // A CI invocation needs no visit tracking, cached identity, or live sockets.
  // Set this before authenticating so the SDK does not open background handles.
  puter.socketEnabled = false;
  puter.setAuthToken(token.trim());
  return puter;
}

async function ensureDirectory(puter, directory) {
  let existing;
  try { existing = await puter.fs.stat(directory); }
  catch (error) { if (!isMissingResource(error)) throw error; }
  if (isMissingResource(existing)) existing = undefined;
  if (!existing) {
    try { await puter.fs.mkdir(directory, { createMissingParents: true, dedupeName: false }); }
    catch (error) { if (!existsCodes.has(errorCode(error))) throw error; }
    existing = await puter.fs.stat(directory);
  }
  if (!existing?.is_dir || !existing.uid) throw new Error('The release path is not a directory.');
  return existing;
}

async function listFiles(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(path.join(directory, prefix), { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(directory, relative));
    else if (entry.isFile()) files.push(relative);
    else throw new Error('Deployment output must contain only regular files and directories.');
  }
  return files;
}

export async function deployToPuter({ puter, subdomain, releasePath, sourcePath = 'build/client', verify = verifyBuild, log = console.log }) {
  await verify(sourcePath);
  const perform = async (label, operation) => {
    log(label);
    try { return await operation(); }
    catch (error) {
      const code = String(errorCode(error) || '').replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 80);
      // SDK error objects may carry request details; never print those or the token.
      throw new Error(`${label} failed${code ? ` (${code})` : ''}. Check the Puter account and deployment settings.`);
    }
  };

  const user = await perform('Validating Puter credentials', () => puter.auth.getUser());
  const directory = resolveReleasePath(releasePath, user?.username);
  const currentSite = await perform('Checking website binding', async () => {
    try {
      const site = await puter.hosting.get(subdomain);
      if (!site || isMissingResource(site)) return undefined;
      if (site.error) throw site;
      return site;
    } catch (error) { if (isMissingResource(error)) return undefined; throw error; }
  });
  const folder = await perform('Preparing release directory', () => ensureDirectory(puter, directory));
  const files = await listFiles(sourcePath);
  if (!files.length) throw new Error('No deployment files were found.');
  await perform(`Uploading ${files.length} release files`, async () => {
    let next = 0;
    const workers = Array.from({ length: Math.min(4, files.length) }, async () => {
      while (next < files.length) {
        const relative = files[next++];
        const data = await readFile(path.join(sourcePath, relative));
        const file = await puter.fs.write(`${directory}/${relative}`, data, { overwrite: true, dedupeName: false, createMissingParents: true });
        if (!file || file.error || !(file.uid || file.id || file.path)) throw file?.error || new Error('Upload did not return a stored file.');
      }
    });
    const results = await Promise.allSettled(workers);
    const failure = results.find((result) => result.status === 'rejected');
    if (failure) throw failure.reason;
  });
  await perform('Publishing complete release', async () => {
    const site = !currentSite ? await puter.hosting.create(subdomain, directory)
      : currentSite.root_dir?.uid === folder.uid ? currentSite
      : await puter.hosting.update(subdomain, directory);
    if (site?.subdomain !== subdomain) throw new Error('Puter did not confirm the requested website.');
  });
  return { deploymentUrl: `https://${subdomain}.puter.site`, releasePath: directory, deployedFiles: files.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const config = deploymentConfig(process.env);
    const puter = await createPuterClient(process.env.PUTER_TOKEN);
    const result = await deployToPuter({ puter, subdomain: config.subdomain, releasePath: config.releasePath });
    if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `deployment_url=${result.deploymentUrl}\nrelease_path=${result.releasePath}\ndeployed_files=${result.deployedFiles}\n`);
    await new Promise((resolve) => process.stdout.write(`Deployed ${result.deployedFiles} files to ${result.deploymentUrl}\n`, resolve));
    // The SDK retains background handles. This one-shot command has awaited all
    // uploads and output writes, so close those handles when its work is finished.
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Puter deployment failed.';
    await new Promise((resolve) => process.stderr.write(`${message}\n`, resolve));
    process.exit(1);
  }
}
