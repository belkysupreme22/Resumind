import { appendFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function deploymentRelease(environment) {
  const { GITHUB_REPOSITORY: repository, GITHUB_SHA: commit, GITHUB_RUN_ID: run, GITHUB_RUN_ATTEMPT: attempt, DEPLOYMENT_URL: website, RELEASE_PATH: folder } = environment;
  if (!/^[\w-]+\/[\w.-]+$/.test(repository ?? '') || !/^[a-f0-9]{40}$/.test(commit ?? '') || !/^\d+$/.test(run ?? '') || !/^\d+$/.test(attempt ?? '')) {
    throw new Error('Valid repository, commit, and deployment run identifiers are required.');
  }
  const url = new URL(website);
  if (url.protocol !== 'https:' || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.puter\.site$/.test(url.hostname) || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Release notes require an HTTPS Puter website URL.');
  }
  const suffix = `/Sites/resumind/releases/${commit}/${run}-${attempt}`;
  if (typeof folder !== 'string' || !folder.endsWith(suffix) || !/^\/[^/\r\n`]+$/.test(folder.slice(0, -suffix.length))) {
    throw new Error('The release folder must match this deployment commit and run.');
  }
  const repositoryUrl = `https://github.com/${repository}`;
  return {
    tag: `deploy-${run}-${attempt}`,
    title: `Resumind ${commit.slice(0, 7)}`,
    notes: `**Live application:** [${url.hostname}](${url.origin})\n\n` +
      `- Commit: [${commit.slice(0, 7)}](${repositoryUrl}/commit/${commit})\n` +
      `- Deployment: [Run ${run}, attempt ${attempt}](${repositoryUrl}/actions/runs/${run})\n` +
      `- Puter release folder: \`${folder}\`\n\n` +
      `The attached \`resumind-client.tar.gz\` contains the tested static build, including SPA routing configuration. The live URL follows the latest successful deployment.\n`,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const release = deploymentRelease(process.env);
    await writeFile(process.argv[2] ?? 'release-notes.md', release.notes);
    if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `tag=${release.tag}\ntitle=${release.title}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Could not prepare release notes.');
    process.exitCode = 1;
  }
}
