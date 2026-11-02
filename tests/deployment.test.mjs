import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deploymentConfig } from '../scripts/puter-deploy-config.mjs';
import { verifyDeployment } from '../scripts/verify-deployment.mjs';

const environment = () => ({
  PUTER_TOKEN: 'test-only-placeholder',
  PUTER_SUBDOMAIN: 'resumind-example',
  GITHUB_SHA: 'a'.repeat(40),
  GITHUB_RUN_ID: '123',
  GITHUB_RUN_ATTEMPT: '1',
});
const expectedHtml = '<script type="module" src="/assets/entry-current.js"></script>';
const routerHtml = (hash) => `<!DOCTYPE html><html><head>
  <script async="" src="https://js.puter.com/v2/"></script>
  <link rel="modulepreload" href="/assets/manifest-current.js"/>
  <link rel="modulepreload" href="/assets/entry.client-${hash}.js"/>
  </head><body><script type="module" async="">import "/assets/manifest-current.js";
  import * as route0 from "/assets/root-current.js";
  window.__reactRouterRouteModules = {"root":route0};
  import("/assets/entry.client-${hash}.js");</script></body></html>`;

test('accepts a website label, hostname, or root HTTPS URL', () => {
  for (const input of ['resumind-example', 'resumind-example.puter.site', 'https://resumind-example.puter.site/']) {
    const config = deploymentConfig({ ...environment(), PUTER_SUBDOMAIN: input });
    assert.equal(config.subdomain, 'resumind-example');
    assert.equal(config.releasePath, `~/Sites/resumind/releases/${'a'.repeat(40)}/123-1`);
    assert.equal('token' in config, false);
  }
});

test('rejects app launcher links, invalid domains, and absent credentials', () => {
  for (const input of ['', 'https://puter.com/app/ai-powered-resume-analyser', 'resumind.puter.app', 'a/b', '-bad', 'https://example.com', 'https://x.puter.site/?a=1']) {
    assert.throws(() => deploymentConfig({ ...environment(), PUTER_SUBDOMAIN: input }));
  }
  assert.throws(() => deploymentConfig({ ...environment(), PUTER_TOKEN: '' }), /PUTER_TOKEN/);
});

test('uses a fresh release folder for retries and rejects unsafe run identifiers', () => {
  const first = deploymentConfig(environment());
  const retry = deploymentConfig({ ...environment(), GITHUB_RUN_ATTEMPT: '2' });
  assert.notEqual(first.releasePath, retry.releasePath);
  assert.throws(() => deploymentConfig({ ...environment(), GITHUB_SHA: '../../other' }), /identifiers/);
});

test('checks root, upload, and dashboard against the tested entry point', async () => {
  const routes = [];
  await verifyDeployment('https://resumind-example.puter.site', { expectedHtml, fetchPage: async (url) => {
    routes.push(url.pathname);
    return new Response(expectedHtml, { status: 200 });
  } });
  assert.deepEqual(routes, ['/', '/upload', '/dashboard']);
});

test('verifies the React Router SPA inline bootstrap used by the production build', async () => {
  const routes = [];
  await verifyDeployment('https://resumind-example.puter.site', {
    expectedHtml: routerHtml('new'),
    fetchPage: async (url) => { routes.push(url.pathname); return new Response(routerHtml('new')); },
  });
  assert.deepEqual(routes, ['/', '/upload', '/dashboard']);
});

test('rejects an older React Router entry even when other asset references match', async () => {
  await assert.rejects(verifyDeployment('https://resumind-example.puter.site', {
    expectedHtml: routerHtml('new'), attempts: 1,
    fetchPage: async () => new Response(routerHtml('old')),
  }), /tested build/);
});

test('preloads and an external SDK are not accepted as the application bootstrap', async () => {
  let requested = false;
  await assert.rejects(verifyDeployment('https://resumind-example.puter.site', {
    expectedHtml: '<script src="https://js.puter.com/v2/"></script><link rel="modulepreload" href="/assets/entry.client-current.js"/>',
    fetchPage: async () => { requested = true; return new Response(''); },
  }), /no JavaScript entry point/);
  assert.equal(requested, false);
});

test('waits for routing config propagation and then accepts the deployed build', async () => {
  let ready = false;
  let waits = 0;
  await verifyDeployment('https://resumind-example.puter.site', { expectedHtml,
    fetchPage: async (url) => new Response(expectedHtml, { status: url.pathname !== '/' && !ready ? 404 : 200 }),
    wait: async () => { waits++; ready = true; },
  });
  assert.equal(waits, 1);
});

test('rejects stale builds or failed routes after bounded retries', async () => {
  await assert.rejects(verifyDeployment('https://resumind-example.puter.site', { expectedHtml, attempts: 2, wait: async () => {}, fetchPage: async () => new Response('old build', { status: 200 }) }), /tested build/);
  await assert.rejects(verifyDeployment('https://resumind-example.puter.site', { expectedHtml, attempts: 1, fetchPage: async () => new Response('not found', { status: 404 }) }), /status 200/);
});

test('live verification only targets HTTPS Puter website addresses', async () => {
  let requested = false;
  await assert.rejects(verifyDeployment('https://example.com', { expectedHtml, fetchPage: async () => { requested = true; } }), /Puter website/);
  assert.equal(requested, false);
});
