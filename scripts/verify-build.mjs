import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function verifyBuild(directory = 'build/client') {
  const root = path.resolve(directory);
  const requireFile = async (relativePath) => {
    const file = await stat(path.join(root, relativePath)).catch(() => null);
    if (!file?.isFile() || file.size === 0) throw new Error(`Missing or empty build file: ${relativePath}`);
  };

  await requireFile('index.html');
  await requireFile('.puter_site_config');
  await requireFile('pdf.worker.min.mjs');
  const config = JSON.parse(await readFile(path.join(root, '.puter_site_config'), 'utf8'));
  if (config.errors?.['404']?.file !== '/index.html' || config.errors['404'].status !== 200) {
    throw new Error('Puter SPA routing must serve /index.html with status 200 for missing paths.');
  }

  const html = await readFile(path.join(root, 'index.html'), 'utf8');
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)(?:[?#][^"]*)?"/g)].map((match) => match[1].slice(1));
  if (!assets.some((asset) => asset.endsWith('.js')) || !assets.some((asset) => asset.endsWith('.css'))) {
    throw new Error('The build must reference generated JavaScript and CSS.');
  }
  for (const asset of new Set(assets)) await requireFile(asset);
  for (const theme of ['light', 'dark']) await requireFile(`images/product/dashboard-${theme}.jpg`);
  return root;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await verifyBuild(process.argv[2]);
    console.log('Build verified: entry assets, PDF worker, product images, and Puter SPA routing.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Build verification failed.');
    process.exitCode = 1;
  }
}
