import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { releaseInfo, stageRelease } from './prepare-plugin-release.mjs';
import { publishRelease } from './publish-plugin-release.mjs';

const source = 'a'.repeat(40);
const repository = 'example/plugins';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'plugin-release-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const plugin = 'test-plugin';
  const pkg = {
    name: '@headlamp-k8s/test-plugin', version: '1.2.3-alpha.1',
    scripts: { build: 'headlamp-plugin build', package: 'headlamp-plugin package' },
  };
  await mkdir(join(root, plugin));
  await writeFile(join(root, plugin, 'package.json'), JSON.stringify(pkg));
  await writeFile(join(root, plugin, 'package-lock.json'), JSON.stringify({
    packages: { '': { name: pkg.name, version: pkg.version } },
  }));
  const directory = join(root, 'artifacts');
  await mkdir(directory);
  const info = await releaseInfo(root, plugin);
  await writeFile(join(directory, info.archive), 'actual packaged plugin bytes');
  await stageRelease(root, plugin, source, directory);
  await writeFile(join(directory, `${info.archive}.intoto.jsonl`), 'provenance');
  const state = {
    releases: [], refs: [], assets: [], nextId: 1, tagSource: source, calls: [],
    verifySignatureFailure: false, verifyProvenanceFailure: false,
    intercept: () => undefined,
  };
  const json = data => Buffer.from(JSON.stringify(data));
  const run = (program, args) => {
    state.calls.push({ program, args });
    const intercepted = state.intercept(program, args);
    if (intercepted !== undefined) return intercepted;
    if (program === 'cosign') {
      if (args[0] === 'sign-blob') {
        writeFileSync(args[args.indexOf('--bundle') + 1], 'signature');
      } else {
        assert.equal(args[0], 'verify-blob');
        assert.equal(args[args.indexOf('--certificate-identity') + 1],
          `https://github.com/${repository}/.github/workflows/prepare-plugin-release.yml@refs/heads/main`);
        assert.equal(args[args.indexOf('--certificate-oidc-issuer') + 1], 'https://token.actions.githubusercontent.com');
        if (state.verifySignatureFailure) throw new Error('Signature verification failed');
      }
      return Buffer.from('Verified');
    }
    assert.equal(program, 'gh');
    if (args[0] === 'attestation') {
      assert.equal(args[1], 'verify');
      assert.equal(args[args.indexOf('--source-digest') + 1], source);
      assert.equal(args[args.indexOf('--source-ref') + 1], 'refs/heads/main');
      assert.equal(args[args.indexOf('--cert-identity') + 1],
        `https://github.com/${repository}/.github/workflows/prepare-plugin-release.yml@refs/heads/main`);
      if (state.verifyProvenanceFailure) throw new Error('Provenance verification failed');
      return Buffer.from('Verified');
    }
    if (args[0] === 'release') {
      assert.equal(args[1], 'upload');
      assert.equal(args[2], info.tag);
      assert.ok(!args.includes('--clobber'));
      const name = args[3].split('/').at(-1);
      assert.ok(!state.assets.some(asset => asset.name === name));
      state.assets.push({
        id: state.nextId++, name, state: 'uploaded', contents: readFileSync(args[3]),
      });
      return Buffer.from('');
    }
    assert.equal(args[0], 'api');
    const endpoint = args.find(arg => arg.startsWith('repos/'));
    assert.ok(endpoint.startsWith(`repos/${repository}/`));
    if (endpoint.includes('/commits/')) return json({ sha: state.tagSource });
    if (endpoint.includes('/git/matching-refs/')) return json(state.refs);
    if (endpoint.endsWith('/git/refs')) {
      state.refs.push({ ref: `refs/tags/${info.tag}` });
      return json(state.refs.at(-1));
    }
    if (endpoint.endsWith('/releases?per_page=100')) return json([state.releases]);
    if (endpoint.endsWith('/releases') && args.includes('POST')) {
      assert.ok(args.includes('draft=true'));
      assert.ok(args.includes('make_latest=false'));
      const release = { id: 123, tag_name: info.tag, draft: true };
      state.releases.push(release);
      return json(release);
    }
    if (endpoint.endsWith('/releases/123')) return json(state.releases[0]);
    if (endpoint.endsWith('/releases/123/assets?per_page=100')) return json([state.assets]);
    if (endpoint.includes('/releases/assets/')) {
      const id = Number(endpoint.split('/').at(-1));
      return state.assets.find(asset => asset.id === id).contents;
    }
    throw new Error(`Unexpected command ${JSON.stringify(args)}`);
  };
  const publish = () => publishRelease({ root, directory, plugin, source, repository }, run);
  const writes = () => state.calls.filter(call => call.args.includes('POST') || call.args[0] === 'release');
  return { root, plugin, pkg, info, directory, state, run, publish, writes };
}

test('creates a draft, uploads the original archive and both bundles, then verifies attached copies', async t => {
  const f = await fixture(t);
  const result = await f.publish();
  assert.equal(result.tag, f.info.tag);
  assert.equal(result.sha256, createHash('sha256').update('actual packaged plugin bytes').digest('hex'));
  assert.equal(f.state.releases[0].draft, true);
  assert.equal(f.state.assets.length, 3);
  assert.equal(f.state.calls.filter(call => call.program === 'gh' && call.args[0] === 'attestation').length, 2);
  assert.ok(f.state.calls.every(call => !call.args.includes('publish') && !call.args.includes('--clobber')));
});

test('rerunning an already complete draft verifies it without changing assets', async t => {
  const f = await fixture(t);
  await f.publish();
  const before = f.state.assets.map(asset => ({ ...asset }));
  f.state.calls.length = 0;
  await f.publish();
  assert.deepEqual(f.state.assets, before);
  assert.equal(f.writes().length, 0);
  assert.equal(f.state.calls.filter(call => call.args[0] === 'sign-blob').length, 0);
});

test('failed provenance upload is recoverable without replacing the archive or signature', async t => {
  const f = await fixture(t);
  f.state.intercept = (_program, args) => {
    if (args[0] === 'release' && args[3].endsWith('.intoto.jsonl')) throw new Error('Upload failed');
  };
  await assert.rejects(f.publish(), /Upload failed/);
  assert.equal(f.state.assets.length, 2);
  const ids = f.state.assets.map(asset => asset.id);
  f.state.intercept = () => undefined;
  await f.publish();
  assert.deepEqual(f.state.assets.slice(0, 2).map(asset => asset.id), ids);
  assert.equal(f.state.assets.length, 3);
});

test('different archive bytes on a rerun fail rather than changing the catalog checksum', async t => {
  const f = await fixture(t);
  await f.publish();
  await writeFile(join(f.directory, f.info.archive), 'rebuilt with different timestamps');
  await rm(join(f.directory, 'release.json'));
  await rm(join(f.directory, `${f.info.archive}.intoto.jsonl`));
  await rm(join(f.directory, `${f.info.archive}.sigstore.json`));
  await stageRelease(f.root, f.plugin, source, f.directory);
  await writeFile(join(f.directory, `${f.info.archive}.intoto.jsonl`), 'new provenance');
  f.state.calls.length = 0;
  await assert.rejects(f.publish(), /Draft archive differs/);
  assert.equal(f.writes().length, 0);
});

test('published releases are never modified', async t => {
  const f = await fixture(t);
  f.state.releases.push({ id: 123, tag_name: f.info.tag, draft: false });
  await assert.rejects(f.publish(), /published release/);
  assert.equal(f.writes().length, 0);
});

test('existing tags must identify the actual producing source commit', async t => {
  const f = await fixture(t);
  f.state.refs.push({ ref: `refs/tags/${f.info.tag}` });
  f.state.tagSource = 'b'.repeat(40);
  await assert.rejects(f.publish(), /different source commit/);
  assert.equal(f.writes().length, 0);
});

for (const field of ['source', 'sha256', 'archive', 'version']) {
  test(`mismatching build metadata ${field} is rejected before external commands`, async t => {
    const f = await fixture(t);
    const path = join(f.directory, 'release.json');
    const info = JSON.parse(await readFile(path, 'utf8'));
    info[field] = 'wrong';
    await writeFile(path, JSON.stringify(info));
    await assert.rejects(f.publish(), /metadata does not match/);
    assert.equal(f.state.calls.length, 0);
  });
}

test('invalid provenance fails before creating a tag or draft', async t => {
  const f = await fixture(t);
  f.state.verifyProvenanceFailure = true;
  await assert.rejects(f.publish(), /Provenance verification failed/);
  assert.equal(f.writes().length, 0);
});

test('signature verification failure prevents any asset upload', async t => {
  const f = await fixture(t);
  f.state.verifySignatureFailure = true;
  await assert.rejects(f.publish(), /Signature verification failed/);
  assert.equal(f.state.assets.length, 0);
});

test('an API failure is surfaced, not treated as an absent release', async t => {
  const f = await fixture(t);
  f.state.intercept = (_program, args) => {
    if (args.includes(`${`repos/${repository}`}/releases?per_page=100`)) throw new Error('API unavailable');
  };
  await assert.rejects(f.publish(), /API unavailable/);
  assert.equal(f.writes().length, 0);
});

test('ambiguous release tags are rejected', async t => {
  const f = await fixture(t);
  f.state.releases.push(...[123, 124].map(id => ({ id, tag_name: f.info.tag, draft: true })));
  await assert.rejects(f.publish(), /Multiple releases/);
  assert.equal(f.writes().length, 0);
});

test('unexpected draft attachments are not overwritten or ignored', async t => {
  const f = await fixture(t);
  f.state.releases.push({ id: 123, tag_name: f.info.tag, draft: true });
  f.state.refs.push({ ref: `refs/tags/${f.info.tag}` });
  f.state.assets.push({ id: 1, name: 'unexpected.tar.gz', state: 'uploaded', contents: Buffer.from('unexpected') });
  await assert.rejects(f.publish(), /unexpected or duplicate assets/);
  assert.equal(f.writes().length, 0);
});

test('a concurrent publication stops subsequent uploads', async t => {
  const f = await fixture(t);
  f.state.intercept = (_program, args) => {
    if (args[0] === 'release') f.state.releases[0].draft = false;
  };
  await assert.rejects(f.publish(), /Release changed/);
  assert.equal(f.state.assets.length, 1);
});

test('attached archive corruption is detected before reporting success', async t => {
  const f = await fixture(t);
  f.state.intercept = (_program, args) => {
    if (args.find(arg => arg.startsWith('repos/'))?.includes('/releases/assets/1')) return Buffer.from('corrupt');
  };
  await assert.rejects(f.publish(), /Uploaded archive differs/);
});

for (const plugin of ['../plugin', 'plugin/path', '-option', 'plugin\nname', 'Plugin']) {
  test(`rejects unsafe plugin ${JSON.stringify(plugin)}`, async t => {
    const f = await fixture(t);
    await assert.rejects(releaseInfo(f.root, plugin), /Invalid/);
  });
}

test('plugin directory cannot be a symlink', async t => {
  const f = await fixture(t);
  await symlink(join(f.root, f.plugin), join(f.root, 'alias'));
  await assert.rejects(releaseInfo(f.root, 'alias'), /symlink/);
});

for (const version of ['01.2.3', '1.2.3+build', '1.2.3-alpha.01', '$(whoami)', undefined]) {
  test(`rejects invalid package version ${JSON.stringify(version)}`, async t => {
    const f = await fixture(t);
    await writeFile(join(f.root, f.plugin, 'package.json'), JSON.stringify({ ...f.pkg, version }));
    await assert.rejects(releaseInfo(f.root, f.plugin), /release version/);
  });
}

test('package and lockfile version mismatch is rejected', async t => {
  const f = await fixture(t);
  await writeFile(join(f.root, f.plugin, 'package-lock.json'), '{"packages":{}}');
  await assert.rejects(releaseInfo(f.root, f.plugin), /disagree/);
});

test('unscoped plugin names preserve the existing archive naming convention', async t => {
  const f = await fixture(t);
  f.pkg.name = 'test-plugin';
  await writeFile(join(f.root, f.plugin, 'package.json'), JSON.stringify(f.pkg));
  await writeFile(join(f.root, f.plugin, 'package-lock.json'), JSON.stringify({
    packages: { '': { name: f.pkg.name, version: f.pkg.version } },
  }));
  const info = await releaseInfo(f.root, f.plugin);
  assert.equal(info.archive, 'test-plugin-1.2.3-alpha.1.tar.gz');
});

test('unexpected packaging commands are rejected', async t => {
  const f = await fixture(t);
  f.pkg.scripts.package = 'other-tool';
  await writeFile(join(f.root, f.plugin, 'package.json'), JSON.stringify(f.pkg));
  await assert.rejects(releaseInfo(f.root, f.plugin), /standard build/);
});

test('staging rejects empty archives and unexpected files', async t => {
  const f = await fixture(t);
  await rm(join(f.directory, 'release.json'));
  await rm(join(f.directory, `${f.info.archive}.intoto.jsonl`));
  await writeFile(join(f.directory, f.info.archive), '');
  await assert.rejects(stageRelease(f.root, f.plugin, source, f.directory), /empty/);
  await writeFile(join(f.directory, 'unexpected'), 'extra');
  await assert.rejects(stageRelease(f.root, f.plugin, source, f.directory), /exactly/);
});

test('workflow builds its own main commit and separates publishing privileges', async () => {
  const workflow = await readFile(new URL('../.github/workflows/prepare-plugin-release.yml', import.meta.url), 'utf8');
  assert.match(workflow, /if: github\.ref != 'refs\/heads\/main'/);
  assert.match(workflow, /test "\$\(git rev-parse HEAD\)" = "\$GITHUB_SHA"/);
  assert.match(workflow, /group: plugin-release-\$\{\{ inputs\.plugin \}\}/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /npm ci\n\s+npm run build\n\s+npm run package/);
  const build = workflow.split('  build:')[1].split('  publish:')[0];
  assert.ok(!build.includes('contents: write'));
  assert.match(workflow, /publish:\n\s+needs: build/);
});
