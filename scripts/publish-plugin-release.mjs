import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { releaseInfo } from './prepare-plugin-release.mjs';

export function command(program, args) {
  return execFileSync(program, args, { maxBuffer: 128 * 1024 * 1024, timeout: 300_000 });
}

export async function publishRelease({ root, directory, plugin, repository, source }, run = command) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) || !/^[a-f0-9]{40}$/.test(source)) {
    throw new Error('Expected GITHUB_REPOSITORY and the workflow source SHA');
  }
  const info = await releaseInfo(root, plugin);
  const recorded = JSON.parse(await readFile(join(directory, 'release.json'), 'utf8'));
  const archivePath = join(directory, info.archive);
  const bytes = await readFile(archivePath);
  const digest = createHash('sha256').update(bytes).digest('hex');
  if (JSON.stringify(recorded) !== JSON.stringify({ ...info, source, sha256: digest })) {
    throw new Error('Build artifact metadata does not match the workflow source, plugin, or archive');
  }
  const bundlePath = join(directory, `${info.archive}.intoto.jsonl`);
  const signaturePath = join(directory, `${info.archive}.sigstore.json`);
  const identity = `https://github.com/${repository}/.github/workflows/prepare-plugin-release.yml@refs/heads/main`;
  const verifySignature = (archive, signature) => run('cosign', [
    'verify-blob', archive, '--bundle', signature, '--certificate-identity', identity,
    '--certificate-oidc-issuer', 'https://token.actions.githubusercontent.com',
  ]);
  const verifyProvenance = (archive, bundle) => run('gh', [
    'attestation', 'verify', archive, '--repo', repository, '--bundle', bundle,
    '--cert-identity', identity, '--source-digest', source, '--source-ref', 'refs/heads/main',
  ]);
  verifyProvenance(archivePath, bundlePath);
  const endpoint = `repos/${repository}`;
  const api = (...args) => JSON.parse(run('gh', ['api', ...args]).toString());
  const releases = api('--paginate', '--slurp', `${endpoint}/releases?per_page=100`).flat();
  const matches = releases.filter(release => release.tag_name === info.tag);
  if (matches.length > 1) throw new Error('Multiple releases have the requested tag');
  let release = matches[0];
  if (release && !release.draft) throw new Error('Refusing to modify a published release');
  const refs = api(`${endpoint}/git/matching-refs/tags/${info.tag}`);
  const tagExists = refs.some(ref => ref.ref === `refs/tags/${info.tag}`);
  if (tagExists) {
    if (api(`${endpoint}/commits/${info.tag}`).sha !== source) {
      throw new Error('Existing release tag points to a different source commit');
    }
  } else {
    api('--method', 'POST', `${endpoint}/git/refs`, '-f', `ref=refs/tags/${info.tag}`, '-f', `sha=${source}`);
  }
  if (!release) {
    release = api('--method', 'POST', `${endpoint}/releases`,
      '-f', `tag_name=${info.tag}`, '-f', `target_commitish=${source}`, '-f', `name=${info.tag}`,
      '-F', 'draft=true', '-f', 'make_latest=false',
      '-f', `body=Prepared from ${source}.\n\nArchive: ${info.archive}\nSHA256:${digest}\n\nReview release notes and Artifact Hub metadata before publishing.`);
  }
  if (!Number.isSafeInteger(release.id) || !release.draft || release.tag_name !== info.tag) {
    throw new Error('Unexpected release response');
  }
  const listAssets = () => api('--paginate', '--slurp', `${endpoint}/releases/${release.id}/assets?per_page=100`).flat();
  const getRelease = () => api(`${endpoint}/releases/${release.id}`);
  const expectedNames = [info.archive, `${info.archive}.sigstore.json`, `${info.archive}.intoto.jsonl`];
  const assets = listAssets();
  if (assets.some(asset => !expectedNames.includes(asset.name))
    || new Set(assets.map(asset => asset.name)).size !== assets.length) {
    throw new Error('Draft has unexpected or duplicate assets; inspect it before rerunning');
  }
  const temp = await mkdtemp(join(tmpdir(), 'plugin-release-'));
  const download = async asset => {
    if (asset.state !== 'uploaded') throw new Error(`Incomplete upload: ${asset.name}`);
    const path = join(temp, asset.name);
    await writeFile(path, run('gh', [
      'api', '-H', 'Accept: application/octet-stream', `${endpoint}/releases/assets/${asset.id}`,
    ]));
    return path;
  };
  try {
    // Never replace an archive on a rerun: its reviewed catalog checksum must remain valid.
    for (const asset of assets) {
      const downloaded = await download(asset);
      if (asset.name === info.archive) {
        if (!(await readFile(downloaded)).equals(bytes)) {
          throw new Error('Draft archive differs from this build; rerun only failed jobs to reuse the original build artifact');
        }
      } else if (asset.name.endsWith('.sigstore.json')) {
        verifySignature(archivePath, downloaded);
      } else {
        verifyProvenance(archivePath, downloaded);
      }
    }
    if (!assets.some(asset => asset.name.endsWith('.sigstore.json'))) {
      run('cosign', ['sign-blob', '--yes', '--bundle', signaturePath, archivePath]);
      verifySignature(archivePath, signaturePath);
    }
    for (const name of expectedNames) {
      if (assets.some(asset => asset.name === name)) continue;
      const current = getRelease();
      if (!current.draft || current.tag_name !== info.tag) throw new Error('Release changed during preparation');
      run('gh', ['release', 'upload', info.tag, join(directory, name), '--repo', repository]);
    }
    const finalRelease = getRelease();
    const finalAssets = listAssets();
    if (!finalRelease.draft || finalRelease.tag_name !== info.tag
      || finalAssets.length !== expectedNames.length
      || expectedNames.some(name => finalAssets.filter(asset => asset.name === name).length !== 1)
      || api(`${endpoint}/commits/${info.tag}`).sha !== source) {
      throw new Error('Release changed during preparation or an attachment is missing');
    }
    for (const asset of finalAssets) await download(asset);
    if (!(await readFile(join(temp, info.archive))).equals(bytes)) throw new Error('Uploaded archive differs from the build');
    verifySignature(join(temp, info.archive), join(temp, `${info.archive}.sigstore.json`));
    verifyProvenance(join(temp, info.archive), join(temp, `${info.archive}.intoto.jsonl`));
    console.log(`Verified draft ${info.tag}\nheadlamp/plugin/archive-url: https://github.com/${repository}/releases/download/${info.tag}/${info.archive}\nheadlamp/plugin/archive-checksum: SHA256:${digest}`);
    return { ...info, sha256: digest };
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await publishRelease({
      root: process.cwd(), directory: process.argv[2], plugin: process.env.PLUGIN,
      repository: process.env.GITHUB_REPOSITORY, source: process.env.GITHUB_SHA,
    });
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
