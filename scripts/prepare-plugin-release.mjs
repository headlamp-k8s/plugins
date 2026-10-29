import { createHash } from 'node:crypto';
import { mkdir, readFile, realpath, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function releaseInfo(root, plugin) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(plugin)) throw new Error('Invalid top-level plugin directory');
  const expected = join(await realpath(root), plugin);
  const directory = await realpath(expected);
  if (directory !== expected) {
    throw new Error('Plugin must be a real top-level directory, not a symlink');
  }
  const pkg = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
  if (typeof pkg.name !== 'string' || !/^(?:@headlamp-k8s\/)?[a-z0-9][a-z0-9-]*$/.test(pkg.name)
    || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/.test(pkg.version)
    || typeof pkg.version !== 'string'
    || pkg.version.split('-').slice(1).join('-').split('.').some(part => /^\d+$/.test(part) && part.length > 1 && part.startsWith('0'))) {
    throw new Error('Expected a plugin package name and a release version without build metadata');
  }
  const lock = JSON.parse(await readFile(join(directory, 'package-lock.json'), 'utf8'));
  if (lock.packages?.['']?.name !== pkg.name || lock.packages?.['']?.version !== pkg.version) {
    throw new Error('Plugin package.json and package-lock.json disagree');
  }
  if (pkg.scripts?.package !== 'headlamp-plugin package' || typeof pkg.scripts?.build !== 'string') {
    throw new Error('Plugin must use the standard build and headlamp-plugin package commands');
  }
  return {
    plugin, version: pkg.version, packageName: pkg.name,
    tag: `${plugin}-${pkg.version}`,
    archive: `${pkg.name.replace('@', '').replace('/', '-')}-${pkg.version}.tar.gz`,
  };
}

export async function stageRelease(root, plugin, source, output) {
  if (!/^[a-f0-9]{40}$/.test(source)) throw new Error('Expected the checked-out source commit SHA');
  const info = await releaseInfo(root, plugin);
  const files = (await readdir(output)).sort();
  if (files.length !== 1 || files[0] !== info.archive) {
    throw new Error(`Packaging must produce exactly ${info.archive}`);
  }
  const archive = await readFile(join(output, info.archive));
  if (archive.length === 0) throw new Error('Packaged archive is empty');
  const sha256 = createHash('sha256').update(archive).digest('hex');
  await writeFile(join(output, 'release.json'), JSON.stringify({ ...info, source, sha256 }, null, 2) + '\n');
  console.log(`Release ${info.tag}: SHA256:${sha256}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [mode, plugin, output, source] = process.argv.slice(2);
    if (mode === 'validate') {
      const info = await releaseInfo(process.cwd(), plugin);
      await mkdir(output, { recursive: false });
      console.log(JSON.stringify(info));
    } else if (mode === 'stage') {
      await stageRelease(process.cwd(), plugin, source, output);
    } else {
      throw new Error('Usage: prepare-plugin-release.mjs validate|stage <plugin> <output> [source SHA]');
    }
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
