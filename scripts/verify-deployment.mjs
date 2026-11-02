import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { javascriptEntry } from './build-entry.mjs';

export async function verifyDeployment(base, { expectedHtml, fetchPage = fetch, wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), attempts = 7 } = {}) {
  const url = new URL(base);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.puter.site') || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Expected an HTTPS Puter website deployment URL.');
  }
  const html = expectedHtml ?? await readFile('build/client/index.html', 'utf8');
  const entry = javascriptEntry(html);
  if (!entry) throw new Error('The tested build has no JavaScript entry point.');
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      for (const route of ['/', '/upload', '/dashboard']) {
        const response = await fetchPage(new URL(route, url), { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
        if (response.status !== 200 || !(await response.text()).includes(entry)) throw new Error(`Live route ${route} did not serve the tested build with status 200.`);
      }
      return;
    } catch (error) {
      if (attempt === attempts - 1) throw error;
      // Puter caches its SPA routing configuration for up to 60 seconds.
      console.log('Waiting for the deployed build and SPA routing to become available…');
      await wait(10_000);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await verifyDeployment(process.env.DEPLOYMENT_URL);
    console.log('Live entry page and workspace deep links serve the tested build.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Live deployment verification failed.');
    process.exitCode = 1;
  }
}
