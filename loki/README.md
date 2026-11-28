# Loki historical logs (experimental)

Read-only standalone historical search, including logs from deleted Pods **if
collected and still retained in Loki**. It never lists live Pods to build a query.
No collection, storage, retention management, live tail or Grafana embedding.
Workload shortcuts are follow-up work.

## Supported authorization model

The first version supports an in-cluster HTTP Loki gateway, reached through the
Kubernetes API Service proxy using the signed-in user's Kubernetes credentials.
Configure the exact namespace, Service and port in the page's datasource section.
No arbitrary external URLs, credentials or tenant headers are accepted.

Grant Service proxy permission **only to users allowed to query all logs in the
gateway's configured tenant**. Kubernetes namespace filters in this UI are NOT
authorization. The gateway must use a fixed trusted tenant; do not trust tenant
headers supplied by a client. Do not grant direct access to the underlying Loki
service or a more privileged gateway. Kubernetes access control must also deny
unintended proxy/port-forward/exec routes. Restrict networking and gateway access
in a production deployment. This plugin does not enforce per-namespace log access.

The checked-in example uses a single tenant and a gateway that exposes only
query_range. It is a local evaluation setup, not a production security deployment.
For multi-user, multi-tenant installations, first agree and test the gateway's
identity and authorization policy. Hosted Loki/Grafana Cloud is not supported.

## Installation and development

From this directory: `npm ci`, `npm start`, and load the development plugin in
Headlamp using its Plugin Development Mode. For checks run `npm test`,
`npm run tsc`, `npm run lint`, `npm run build`, and
`npm run storybook-build`. Run `npm run package` to produce a local plugin archive.
This source is not yet a published Artifact Hub release.

## Search

Open **Historical logs**. Expand datasource configuration, enter the Service
coordinates and the exact cluster label value stored by your collector; save and
test. Settings are scoped to the Headlamp cluster context name and contain no
secrets. Query fields are literal values, not raw LogQL. An exact namespace is
required; Pod and container are optional. Deleted names can be entered manually.
This initial version supports indexed-label mappings only, not structured metadata.
It does not infer historical Deployment ownership or selectors.

Relative windows: 15 minutes, one hour, 24 hours. Absolute timestamps must include
a timezone. Maximum range: seven days. Queries start at 200 entries. **Load older**
repeats the same frozen window with a doubled limit (up to 2,000), replacing the
result rather than deduplicating messages or advancing a timestamp cursor.
This preserves real repeated lines and equal timestamps within each response.
It is bounded prefix expansion, not a guarantee of complete export. At a full
limit, results may be truncated even within a timestamp; narrow the range.
No total count is inferred. At most 2,000 rows are rendered. Each click issues one
request. Configuration/filter changes, cancel, and cluster unmount invalidate work.
Empty results are distinct from authorization, parsing, transport and rate errors.
Use narrow incident windows to limit repeated server scans and browser memory.

## Reproducible local evaluation

See [test-files/README.md](test-files/README.md) for Loki, Alloy, the gateway,
RBAC, and an emitter. The collector records indexed labels `cluster`,
`namespace`, `pod`, `container`. For a second cluster, replace the static
collector cluster value with a distinct identifier and configure that context's
datasource accordingly. Current live Pod names never constrain historical lookup.

## Verification status

Automated query/response and UI regressions are included. Live collector ingestion,
Pod deletion recovery, two-cluster isolation, deployed gateway denial and browser
smoke verification must be recorded separately; unit mocks do not establish them.
