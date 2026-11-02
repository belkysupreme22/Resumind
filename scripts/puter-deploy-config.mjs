import { appendFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function deploymentConfig(environment) {
  if (!environment.PUTER_TOKEN?.trim()) throw new Error('Add the PUTER_TOKEN repository secret under Settings → Secrets and variables → Actions.');
  let subdomain = environment.PUTER_SUBDOMAIN?.trim().toLowerCase() || '';
  if (subdomain.includes('://')) {
    let url;
    try { url = new URL(subdomain); } catch { throw new Error('PUTER_SUBDOMAIN is not a valid website address.'); }
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash) {
      throw new Error('Use a Puter website label or its https://<label>.puter.site address without extra paths.');
    }
    subdomain = url.hostname;
  }
  subdomain = subdomain.replace(/\.puter\.site$/, '');
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(subdomain)) {
    throw new Error('PUTER_SUBDOMAIN must be a website label or .puter.site hostname. Puter app launch links and .puter.app addresses are different from website hosting subdomains.');
  }
  if (!/^[a-f0-9]{40}$/.test(environment.GITHUB_SHA || '') || !/^\d+$/.test(environment.GITHUB_RUN_ID || '') || !/^\d+$/.test(environment.GITHUB_RUN_ATTEMPT || '')) {
    throw new Error('GitHub commit and run identifiers are required to create a unique release folder.');
  }
  return { subdomain, releasePath: `~/Sites/resumind/releases/${environment.GITHUB_SHA}/${environment.GITHUB_RUN_ID}-${environment.GITHUB_RUN_ATTEMPT}` };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const config = deploymentConfig(process.env);
    if (!process.env.GITHUB_OUTPUT) throw new Error('This command must run as a GitHub Actions step.');
    await appendFile(process.env.GITHUB_OUTPUT, `subdomain=${config.subdomain}\nrelease_path=${config.releasePath}\n`);
    console.log('Puter deployment configuration validated.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Invalid deployment configuration.');
    process.exitCode = 1;
  }
}
