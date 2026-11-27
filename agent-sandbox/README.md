# Agent Sandbox for Headlamp

Inspect [Agent Sandbox](https://github.com/kubernetes-sigs/agent-sandbox) resources in Headlamp.

- View Sandboxes and their readiness, operating mode, Pods, Services, conditions, and events.
- View Claims, WarmPools, and Templates when their APIs are available on the selected cluster.
- Follow links between Claims, Sandboxes, WarmPools, and Templates.

The plugin uses the connected user's Kubernetes permissions. Its views are read-only.
A cluster with only the core `Sandbox` CRD can use the Sandbox pages. When multiple clusters are
selected, an extension view is available when all selected clusters serve that API resource.

## Local development

From this directory, with Node.js 22:

```sh
npm ci
npm run build
npm run tsc
npm run lint
npm run format -- --check
npm test
```

Use `npm run start` to load the plugin in a development Headlamp instance. See the
[Headlamp plugin development guide](https://headlamp.dev/docs/latest/development/plugins/).
