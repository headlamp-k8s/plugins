# Kmesh plugin end-to-end tests

These Playwright tests run the production plugin in Headlamp v0.43.0 against a local KWOK v0.8.0 cluster. KWOK provides the control plane and a simulated worker node; Headlamp runs in a separate Docker container. The Gateway API CRD and a minimal `KmeshNodeInfo` CRD are installed so the plugin's Waypoint and Node Security views have real resources to render.

The scenario covers:

- the Kmesh sidebar entry navigating to the Waypoints list;
- a fixture Waypoint (a `Gateway` with `gatewayClassName: kmesh-waypoint`) showing up in the list and its detail page showing its `Programmed` condition;
- the Node Security list detecting an SPI mismatch between two fixture `KmeshNodeInfo` nodes.

## Run

Install Docker, kwokctl v0.8.0, kubectl, Node.js, and npm, then run:

```sh
npm ci
npm run e2e
```

The cross-platform TypeScript runner builds the plugin and Headlamp image, creates the KWOK cluster, installs the Gateway API and Kmesh CRDs plus fixtures, runs Headlamp and Chromium, and deletes the cluster afterward. Set `KEEP_E2E_CLUSTER=true` to retain it for debugging.

`npm run e2e:playwright` runs only the Playwright scenario against an already running Headlamp instance. It does not build Headlamp or create a cluster. Set `HEADLAMP_URL` if Headlamp is not available at `http://127.0.0.1:4467`.
