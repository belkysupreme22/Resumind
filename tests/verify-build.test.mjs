import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { verifyBuild } from '../scripts/verify-build.mjs';

const fixture = async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'resumind-build-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'assets'));
  await mkdir(path.join(root, 'images/product'), { recursive: true });
  const files = {
    'index.html': '<script src="/assets/app.js"></script><link href="/assets/app.css" rel="stylesheet">',
    '.puter_site_config': JSON.stringify({ errors: { 404: { file: '/index.html', status: 200 } } }),
    'pdf.worker.min.mjs': 'worker',
    'assets/app.js': 'app',
    'assets/app.css': 'css',
    'images/product/dashboard-light.jpg': 'light',
    'images/product/dashboard-dark.jpg': 'dark',
  };
  await Promise.all(Object.entries(files).map(([name, content]) => writeFile(path.join(root, name), content)));
  return root;
};

test('accepts a complete static deployment including hidden SPA config', async (t) => {
  const root = await fixture(t);
  assert.equal(await verifyBuild(root), root);
});

test('blocks deployment when a referenced asset or PDF worker is absent', async (t) => {
  const root = await fixture(t);
  await rm(path.join(root, 'assets/app.js'));
  await assert.rejects(verifyBuild(root), /Missing or empty build file: assets\/app.js/);
  await writeFile(path.join(root, 'assets/app.js'), 'app');
  await rm(path.join(root, 'pdf.worker.min.mjs'));
  await assert.rejects(verifyBuild(root), /pdf.worker/);
});

test('blocks missing, malformed, or incorrect SPA fallback configurations', async (t) => {
  const root = await fixture(t);
  await rm(path.join(root, '.puter_site_config'));
  await assert.rejects(verifyBuild(root), /Missing or empty build file/);
  await writeFile(path.join(root, '.puter_site_config'), '{invalid');
  await assert.rejects(verifyBuild(root), SyntaxError);
  await writeFile(path.join(root, '.puter_site_config'), JSON.stringify({ errors: { 404: { file: '/index.html', status: 404 } } }));
  await assert.rejects(verifyBuild(root), /status 200/);
});

test('blocks an HTML shell without generated application assets', async (t) => {
  const root = await fixture(t);
  await writeFile(path.join(root, 'index.html'), '<h1>Incomplete build</h1>');
  await assert.rejects(verifyBuild(root), /generated JavaScript and CSS/);
});
