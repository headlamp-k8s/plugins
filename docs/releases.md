# Preparing signed plugin releases

The **Prepare signed plugin release** workflow builds the release archive once
in GitHub Actions, records SLSA build provenance, signs the archive with cosign,
and stages a GitHub release draft. Maintainers still review Artifact Hub metadata,
release notes, and the final publication.

Existing archive formats, package names, `<plugin>-<version>` release tags, and
Artifact Hub URL/checksum annotations are unchanged. Signatures and provenance
are additional release attachments, not files inside the plugin archive.

## Release preparation

1. Prepare and merge the plugin source and version bump into `main`. Update both
   the plugin's `package.json` and `package-lock.json`. Do not calculate the
   release checksum from a separate local build.
2. Select **Prepare signed plugin release** in Actions, choose `main`, and enter
   the top-level plugin directory, for example `ai-assistant`. The workflow
   derives the version and archive name from the committed package metadata.
3. Actions checks out the exact workflow commit, installs with `npm ci`, builds,
   and runs the existing `npm run package` command. It attests that archive in
   the producing job, then passes the archive and provenance to a separate
   publishing job. It accepts neither arbitrary source refs nor prebuilt uploads
   as inputs.
4. The publishing job verifies the provenance's workflow identity and source
   commit, signs the archive, and creates the release tag at that source commit.
   It stages three attachments on a **draft** release:
   - `<package>.tar.gz`
   - `<package>.tar.gz.sigstore.json`
   - `<package>.tar.gz.intoto.jsonl`
5. After the run succeeds, use its summary to prepare the existing versioned
   metadata directory, such as `ai-assistant/0.4.2-alpha/`, and snapshot the
   release documentation as usual. Add release notes and the reported
   `headlamp/plugin/archive-url` and `headlamp/plugin/archive-checksum` values
   to `artifacthub-pkg.yml`. Open a metadata PR for review.
6. Publish the verified draft when metadata and release notes are approved.
   Coordinate metadata merging and publication: Artifact Hub cannot download
   draft assets, so a metadata entry merged before publication temporarily
   points to an unavailable archive.

The release tag identifies the source used to build the plugin, not the later
metadata-only commit. A published version cannot be reused. Bump the version
for source changes rather than rebuilding and replacing its released archive.

The workflow builds only its own `main` commit so provenance accurately names
the source. To release older source or a maintenance branch, first design and
document a matching provenance/identity policy; do not simply remove this guard.

## Failures and reruns

Preparation runs for the same plugin are serialized. Do not edit the tag,
release assets, or publish the draft while a run is in progress.

On a publishing failure, use **Re-run failed jobs** within seven days. The
successful build job's saved artifact is reused; missing attachments are added
without overwriting existing ones. Existing signatures and provenance must
verify, the archive must match byte for byte, and the tag must point to the
original source commit. The helper verifies all downloaded release attachments
before reporting success.

Re-running the entire workflow rebuilds the archive. Packaging is not assumed
to be byte-reproducible, so a different archive is rejected rather than silently
invalidating the reviewed Artifact Hub checksum. After artifacts expire, recover
the original bytes through a maintainer-controlled process or prepare a new
version. Do not bypass the mismatch check.

An unsuccessful run can leave a tag and an incomplete **draft**. It is not
automatically deleted or published. Inspect errors and rerun failed jobs; if
abandoning a preparation, manually remove only its draft and unused tag.

## Verifying a downloaded plugin

Download the archive, signature, and provenance from the same GitHub release.
For example:

```sh
package=headlamp-k8s-ai-assistant-0.4.2-alpha.tar.gz
cosign verify-blob "$package" \
  --bundle "${package}.sigstore.json" \
  --certificate-identity 'https://github.com/headlamp-k8s/plugins/.github/workflows/prepare-plugin-release.yml@refs/heads/main' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com

gh attestation verify "$package" \
  --repo headlamp-k8s/plugins \
  --bundle "${package}.intoto.jsonl" \
  --cert-identity 'https://github.com/headlamp-k8s/plugins/.github/workflows/prepare-plugin-release.yml@refs/heads/main'
```

Use cosign v2.6.3 or newer and a current GitHub CLI. Check the reported source
commit against the release tag. Omitting `--bundle` lets `gh` retrieve the
attestation from GitHub instead.

The existing Artifact Hub checksum continues to identify the same archive.
Publishing these additional attachments does not automatically make plugin
installers enforce signature or provenance verification.

## Scope and testing

This workflow applies to new releases prepared through it. Existing release
archives and metadata are not changed, and historical build provenance is not
fabricated. Container image builds are a separate publishing path.

Helpers use the current repository identity so fork tests do not write to the
upstream repository. Fork signatures must not be trusted as upstream signatures.

Run the dependency-free helper tests with:

```sh
node --test scripts/plugin-release.test.mjs
```

Tests substitute the GitHub CLI and cosign boundary while exercising real
files and hashing. Validate OIDC, real attestations, and a draft release in a
fork before using the workflow for a production release.
