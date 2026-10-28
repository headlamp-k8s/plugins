# AI Assistant end-to-end tests

These Playwright tests run the production plugin in Headlamp v0.43.0 against two isolated local KWOK v0.8.0 clusters, exposed as `main` and `secondary`. Each has its own control plane, simulated worker, demo workloads, and warning event while Headlamp runs in a separate Docker container.

The scenarios cover:

- viewing the KWOK-backed cluster in Headlamp;
- changing and persisting preview, Kubernetes tool, and Holmes service settings;
- adding and removing the built-in mock testing model;
- chatting with the fixture-backed model;
- troubleshooting a pod with the scripted agent;
- exploring cluster workloads with the scripted agent.
- background diagnosis scrolling and compact results at desktop and small-window
  sizes, stable reading position, drafting, pause/resume, queued-message priority
  (including chat started during an event read), retry/dismiss, event navigation
  after reopening cached long results, visible keyboard focus, and cluster scope.
  Stale event results and errors are discarded after
  switching clusters. AI responses are fixture-backed; the host, event reads, and
  resource navigation are real. Scope-switch tests use a browser-controlled secondary
  cluster fixture backed by the same KWOK API.
- replacing the default provider in settings while the panel is closed, then
  diagnosing an uncached event with the newly configured provider.
- opening a suggested workload-identity ServiceAccount in the editor from a
  global settings page, verifying the target cluster is shown before applying,
  and applying it to the assistant's cluster. The model response is stubbed;
  the Kubernetes write and read-back use the real KWOK API.
- preserving a chat request's target on a fresh global page and when a different
  cluster page is active;
- requiring an explicit single-cluster choice for multiple request targets or
  missing provenance, then verifying that the other cluster is unchanged.
  Mixed-cluster reads include both handled multi-container log-error paths.
  Those log errors are injected; successful resource reads, writes, and peer-state
  checks use the real control planes.

The single-cluster editor fallback and ordinary diagnosis scenarios advertise only
`main` to the UI. Scope-switch diagnosis tests replace the secondary context with
their browser-controlled fixture.
Multi-cluster scenarios use both independent control planes; they are not aliases.

## Run

Install Docker, kwokctl v0.8.0, kubectl, Node.js, and npm, then run:

```sh
npm ci
npm run e2e
```

To run a focused scenario with the same build and cluster setup, pass Playwright arguments:

```sh
npm run e2e -- proactive-diagnosis.spec.ts --grep "chat starts during an event read"
```

The cross-platform TypeScript runner builds the plugin and Headlamp image, creates both KWOK clusters, runs Headlamp and Chromium, and deletes the clusters afterward. Set `KEEP_E2E_CLUSTER=true` to retain them for debugging. Each run writes local, untracked screenshots to `e2e/screenshots`. Pass Playwright arguments after `--` for a focused run, for example `npm run e2e -- editor-cluster.spec.ts`.

`npm run e2e:playwright` runs only the Playwright scenarios against an already running Headlamp instance. It does not build Headlamp or create a cluster. Set `HEADLAMP_URL` if Headlamp is not available at `http://127.0.0.1:4466`.
