# PR 1 validation

Implemented as an experimental standalone plugin. No live deployment claim.

## Passed locally (2026-11-13)

Node 24.22.1, npm 11.9.0, the lockfile's Headlamp plugin SDK 0.14.x.
- npm test: 19 tests in two files.
- npm run tsc.
- npm run lint (zero warnings).
- npm run build.
- npm run package.
- git diff --check.
- All 17 fixture YAML documents parse.

Behavioral tests cover escaped literal filters, explicit transport cluster identity,
two distinct stored cluster values, exact timestamp preservation, malformed
responses, cancellation, denied statuses, and cluster-unmount invalidation.
The DOM test measures 200, 400, 800, 1,600, then 2,000 rendered rows after five
requests; the older-results action is disabled at the cap. Identical timestamp
and message pairs remain distinct entries. API responses in these tests are mocks.

## Blocked / not established

- npm run storybook-build: this host's os.networkInterfaces call fails with
  uv_interface_addresses / operation not permitted before Storybook builds.
- Headless Chromium exits because socket() is not permitted. No screenshot or
  real-browser/Headlamp installation smoke result is claimed.
- No kubectl, kind or container runtime is available here. Collector ingestion,
  deleted-Pod retrieval, deployed gateway 403, two real clusters and live
  credentials have NOT been verified.
- Fixtures are syntax-checked examples, not runtime-validated infrastructure.
- No upstream CI result, maintainer agreement or release availability is claimed.

Follow test-files/README.md to collect the missing live evidence before treating
this as ready for production or requesting approval.
