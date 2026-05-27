# KubeAtlas plugin for Headlamp

A [Headlamp](https://headlamp.dev) plugin that brings the
[KubeAtlas](https://github.com/lithastra/kubeatlas) dependency
graph inside Headlamp — same cartography view as the standalone
KubeAtlas web UI, embedded in the cluster console you already use.

![KubeAtlas plugin inside Headlamp — Dependency Graph entry in the cluster sidebar.](./docs/img/headlamp-main.png)

## What you get

- **Cluster-level dependency graph** — every workload, ConfigMap,
  Secret, Service, Ingress, NetworkPolicy, RBAC binding, and HPA
  laid out as a single canvas using the same cartography
  stylesheet the standalone KubeAtlas UI ships: six node-family
  shapes, edge encoding by weight + dash + colour + arrow.

  ![Cluster-level dependency graph rendered with the cartography stylesheet.](./docs/img/headlamp-clusterview.png)

- **Namespace selector** — switch between the all-namespaces
  cluster view and a single namespace; the dropdown is populated
  from the live cluster graph.

- **Per-resource details** — tap any node to open a right-side
  drawer with the resource's incoming and outgoing edges, each
  edge tagged with its type (`OWNS`, `USES_CONFIGMAP`,
  `ROUTES_TO`, `SCALES`, etc.).

  ![Deployment detail drawer with incoming + outgoing edges.](./docs/img/headlamp-deploymentview.png)

- **Blast radius** — from a selected node, click "↯ Show blast
  radius" to dim everything outside the BFS-reachable downstream
  subgraph. Answers *"if I delete this Secret, what breaks?"*
  without leaving Headlamp.

- **Resource-detail integration** — on Headlamp's own per-resource
  pages, a "KubeAtlas Dependencies" section renders the one-hop
  neighbourhood graph for the resource you're looking at.

- **Theme-aware** — palette follows Headlamp's light/dark mode
  (Parchment for light, Slate for dark) with WCAG AA contrast on
  every text surface.

## How it works

The plugin is a thin read-only client. It talks to a KubeAtlas
server already running in your cluster through Headlamp's
Kubernetes service proxy
(`/api/v1/namespaces/<ns>/services/<svc>:<port>/proxy/...`), so
it works the same whether Headlamp runs in-cluster or as the
desktop app. No KubeAtlas server URL is hard-coded; you pick the
KubeAtlas Service from inside the plugin on first use.

It renders only what the KubeAtlas server exposes and never
imports code from the KubeAtlas main repository. The cartography
stylesheet is a code-level port of the main repo's
`web/src/lib/cytoscape.ts`, kept in sync by hand at release time.

## Prerequisites

- A Kubernetes cluster with
  [KubeAtlas](https://github.com/lithastra/kubeatlas) installed —
  see the [KubeAtlas install
  docs](https://docs.kubeatlas.lithastra.com/installation/helm).
  The plugin needs an in-cluster KubeAtlas Service to talk to
  through Headlamp's API server proxy (a `kubectl atlas
  --local-ui` localhost server is not reachable from the
  plugin — they're in different network namespaces).
- [Headlamp](https://headlamp.dev) — desktop or in-cluster, >= 0.30
  (verified against 0.42, the latest at time of writing).

## Compatibility matrix

| Plugin | KubeAtlas server | Headlamp |
|--------|------------------|----------|
| 1.0.x  | >= 1.3           | >= 0.30  |

## Install

### From the Plugin Catalog (recommended)

Search "KubeAtlas" in Headlamp's Plugin Catalog and install with
one click.

### From source (development / pre-release)

```bash
npm install
npm run build          # produces dist/main.js
```

Then either:

- Run `npm run start` to load the plugin into a local Headlamp
  during development; or
- Copy `dist/main.js` + `package.json` into Headlamp's plugins
  directory. Per the [canonical docs](https://headlamp.dev/docs/latest/development/plugins/building):
  - Linux: `$HOME/.config/Headlamp/plugins/kubeatlas/`
  - macOS: `$HOME/.config/Headlamp/plugins/kubeatlas/`
  - Windows: `%APPDATA%\Headlamp\Config\plugins\kubeatlas\`

  (Note: only Windows has the extra `Config\` segment in its path.
  Linux and macOS Headlamp Desktop both use XDG-style
  `~/.config/Headlamp/`.)

Restart Headlamp (or toggle the plugin off / on under **Settings
→ Plugins**). The **Dependency Graph** entry appears in the
cluster sidebar.

## First-time setup

1. Open **Dependency Graph** from the cluster sidebar.
2. The plugin prompts you to pick the KubeAtlas Service. By
   default this is `kubeatlas` in the `kubeatlas` namespace on
   port `80` (matches the
   [Helm chart's](https://github.com/lithastra/kubeatlas/tree/main/helm/kubeatlas)
   defaults). Confirm or override and continue.
3. The canvas loads with the cluster-level view. Pick a namespace
   from the dropdown to focus, tap any node for the detail
   drawer, or right-click for the blast-radius radial.

## Publishing

See [PUBLISHING.md](./PUBLISHING.md) for the full recipe to cut a
new version, vendor it into
[`headlamp-k8s/plugins`](https://github.com/headlamp-k8s/plugins),
and open the Plugin Catalog PR.

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the toolchain
commands and contribution workflow. The short loop:

```bash
npm install
npm run tsc            # type-check
npm run lint           # eslint
npm test               # vitest
npm run build          # production bundle
```

The test environment stubs jsdom's missing Canvas
(`vitest.setup.ts`) so transitive `@xterm/xterm` imports from
Headlamp's lib barrel don't crash on module load.

## License

Apache 2.0 — see [LICENSE](./LICENSE).
