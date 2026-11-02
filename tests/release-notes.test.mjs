import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deploymentRelease } from '../scripts/release-notes.mjs';

const environment = () => ({
  GITHUB_REPOSITORY: 'belkysupreme22/Resumind',
  GITHUB_SHA: 'a'.repeat(40),
  GITHUB_RUN_ID: '123',
  GITHUB_RUN_ATTEMPT: '1',
  DEPLOYMENT_URL: 'https://resumindd.puter.site',
  RELEASE_PATH: `/belky/Sites/resumind/releases/${'a'.repeat(40)}/123-1`,
});

test('release notes link to the live app, deployed commit, workflow, and rollback folder without credentials', () => {
  const env = { ...environment(), PUTER_TOKEN: 'sensitive-example' };
  const release = deploymentRelease(env);
  assert.equal(release.tag, 'deploy-123-1');
  assert.equal(release.title, 'Resumind aaaaaaa');
  assert.ok(release.notes.includes('[resumindd.puter.site](https://resumindd.puter.site)'));
  assert.ok(release.notes.includes(`/commit/${env.GITHUB_SHA}`));
  assert.ok(release.notes.includes('/actions/runs/123'));
  assert.ok(release.notes.includes(env.RELEASE_PATH));
  assert.ok(release.notes.includes('resumind-client.tar.gz'));
  assert.equal(JSON.stringify(release).includes('sensitive-example'), false);
});

test('repeated preparation is stable and each new deployment attempt gets its own tag', () => {
  const env = environment();
  assert.deepEqual(deploymentRelease(env), deploymentRelease(env));
  const retry = deploymentRelease({ ...env, GITHUB_RUN_ATTEMPT: '2', RELEASE_PATH: env.RELEASE_PATH.replace('/123-1', '/123-2') });
  assert.notEqual(retry.tag, deploymentRelease(env).tag);
});

test('release notes reject missing metadata, unsafe identifiers, and mismatched deployment folders', () => {
  for (const change of [{ GITHUB_REPOSITORY: '../bad' }, { GITHUB_SHA: 'main' }, { GITHUB_RUN_ID: '1\ninjected' }, { GITHUB_RUN_ATTEMPT: '' }, { RELEASE_PATH: '/belky/unrelated' }, { RELEASE_PATH: environment().RELEASE_PATH.replace('/123-1', '/124-1') }]) {
    assert.throws(() => deploymentRelease({ ...environment(), ...change }));
  }
});

test('release notes accept only the deployed Puter website URL', () => {
  for (const website of ['http://resumindd.puter.site', 'https://puter.com/app/resumind', 'https://resumindd.puter.site/other', 'https://user:secret@resumindd.puter.site', 'https://resumindd.puter.site?token=secret', 'https://resumindd.puter.site.evil.example']) {
    assert.throws(() => deploymentRelease({ ...environment(), DEPLOYMENT_URL: website }), /Puter website URL/);
  }
});
