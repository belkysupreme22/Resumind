# Puter CI/CD

The `CI and Puter deployment` GitHub Actions workflow runs tests, type checking,
and a static build on pull requests targeting `main`, pushes to `main`, and manual
runs. The Node version is defined in `.node-version`.

The deploy job runs only on `main`, after checks pass, when `PUTER_SUBDOMAIN` is
configured. It deploys the exact build artifact produced by the checks job.
Pull requests never deploy or receive Puter credentials.

## One-time setup

In the GitHub repository, open **Settings → Secrets and variables → Actions**:

| Type | Name | Value |
| --- | --- | --- |
| Repository secret | `PUTER_TOKEN` | An auth token for the Puter account that owns the website. |
| Repository variable | `PUTER_SUBDOMAIN` | An available website label, such as `resumind-yourname`, or an existing owned `*.puter.site` hostname. |

Store the token only as a GitHub secret. The deployment does not embed it in the
client application. Follow [Puter's authentication documentation](https://docs.puter.com/cli/#authentication)
to authenticate automation, and use the token belonging to the account that will
own the deployment. A missing or expired token causes deployment to fail; checks
can still run independently.

The website label becomes `https://<label>.puter.site`. It is different from a
Puter app launch link such as `https://puter.com/app/ai-powered-resume-analyser`
or an app's `*.puter.app` address. Those app links are not valid values for
`PUTER_SUBDOMAIN`.

If `PUTER_SUBDOMAIN` is not set, deployment is skipped and the checks job explains
the missing setup in its summary. After adding both settings, open **Actions →
CI and Puter deployment → Run workflow**, select `main`, and run it. The workflow
must have been merged to `main` before it can be run manually there.

## Connect a Puter app

If the original app is missing from Dev Center, first check the signed-in Puter
account. An app owned by another account cannot be updated using your token.

To use a new app, create **Resumind** in **Puter Dev Center → My Apps**, then set
its **Settings → Index URL** to the website URL shown by the successful workflow.
Save, then open the app using its new launch link. If you own an existing app,
update that app's Index URL instead to preserve its app identity and launch link.
Changing the backing site does not redirect someone else's old app link.

Future successful pushes to `main` update the website at the same address; you do
not need to upload files in Dev Center again.

## What gets deployed

The build output is `build/client`. The workflow verifies its entry-point assets,
PDF worker, product images, and `.puter_site_config` before packaging it as an
artifact. The archive and Puter upload both include the hidden routing file.
Build and live verification share entry-point detection, including React
Router's inline module bootstrap. A missing bootstrap or entry file is rejected
before uploading to Puter.

`public/.puter_site_config` is copied into the build and makes `/dashboard`,
`/upload`, and review deep links serve `index.html` with HTTP 200. Puter may cache
this routing configuration for up to 60 seconds. Live verification retries while
that configuration propagates and checks that root and workspace routes serve
the tested build's JavaScript entry point.

Each deployment uploads to a new directory:

```text
~/Sites/resumind/releases/<commit-sha>/<run-id>-<run-attempt>
```

The repository's `scripts/deploy-puter.mjs` deployer uses the official Puter Node
SDK at the exact version recorded in `package-lock.json`. It validates the token,
expands the release folder against the authenticated account's home directory,
and creates missing parent folders. Puter's `subject_does_not_exist` response is
handled as a missing resource rather than an authentication failure.

Before uploading, it lists all websites accessible to the token. An existing
matching website is updated; otherwise the deployer attempts to create the
requested name after uploading. A name missing from the list is not guaranteed
to be available: Puter still rejects creation if someone else owns it. The
deployer does not bypass permission failures or update an inaccessible website.

The deployer switches the website binding only after all files upload. Previous
release folders remain available. Runs on `main` are serialized rather than
cancelling a deployment while it is uploading.

All third-party actions are pinned to verified commit SHAs. Checks and deployment
use read-only GitHub repository permissions; the Puter token is confined to the
deployment job. A configured `production` environment can add repository-specific
deployment rules.

## GitHub Releases

After deployment and live verification succeed, a separate job publishes a
GitHub Release with the live website URL, deployed commit, workflow link, Puter
release folder, and the tested `resumind-client.tar.gz` archive. Failed or skipped
deployments and pull requests do not publish releases.

Each deployment has a tag `deploy-<run-id>-<run-attempt>`, pointing to the exact
deployed commit. The release is marked **Latest**. Repeating the publishing step
for the same deployment reuses an existing release and can finish a draft left
by an interrupted upload; it leaves an already published release unchanged.

Only the release job receives `contents: write` through GitHub's built-in
`GITHUB_TOKEN`. No additional secret or Puter credentials are passed to that job.
Repository rules restricting tag creation or releases must allow this workflow.

The website URL always follows the latest deployment. For an older version,
use its attached build archive or retained Puter folder. The Puter `releases`
directory and GitHub Releases are separate records.

If publishing fails after deployment, the website remains deployed. Correct the
release permission or upload issue and re-run the failed job in GitHub Actions.

## Hosting permission failures

Passing the credential check confirms identity, not permission to manage a
particular website. A `forbidden` response during a named website lookup does
not establish that the requested name is available.

The deploy log prints the authenticated Puter username (never the token). Compare
that username with the account that owns the website when diagnosing access.

- If **Listing accessible websites** fails, ensure `PUTER_TOKEN` is an account
  API token with hosting access. Create it in the intended owner's Puter account
  using [Puter's token guide](https://developer.puter.com/tutorials/puter-auth-token/),
  then update the GitHub repository secret directly.
- If **Creating website binding** reports a name conflict, use a different
  `PUTER_SUBDOMAIN`, or use the owning account's token if the website is yours.
  Creating a Resumind app in Dev Center does not reserve `resumind.puter.site`.
- If **Creating website binding** or **Updating website binding** is forbidden,
  check the token's hosting permissions, website ownership, and any account
  restrictions. A valid sign-in alone does not grant hosting write access.

After correcting the settings, run the workflow on `main` again. Never paste
the token into an issue, workflow log, or chat.

## Rollback

The successful run summary records the website URL, commit, and release folder.
Use the previous successful run's folder to restore an earlier deployment with
[Puter hosting update](https://docs.puter.com/Hosting/update/), which repoints the
same website to that folder. Keep the current workflow configuration when doing
a rollback; a Git revert of application changes followed by a normal `main`
deployment is another option.

## Local checks

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run check:build
```

The tests use mocked deployment responses and do not access Puter accounts.
The live deployment verification checks HTTP serving and routing; browser
interaction checks and a real authenticated resume analysis remain separate.

To make CI a merge requirement, create a GitHub branch ruleset for `main` and
require the **Tests, types, and build** status check after its first run.

References: [Puter deployment documentation](https://docs.puter.com/deployments/),
[official Node SDK](https://developer.puter.com/tutorials/puter-js-node-js/),
[SPA routing configuration](https://docs.puter.com/site-config/), and
[Puter app publishing](https://developer.puter.com/tutorials/publish-apps-on-puter/).
