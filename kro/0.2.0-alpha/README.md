# Headlamp kro Plugin

> **Status: alpha.** This plugin is an early release and under active development.

A Headlamp plugin for [kro](https://kro.run) (Kube Resource Orchestrator). It adds
views for ResourceGraphDefinitions (RGDs), the resource APIs they generate, and
the resources kro creates on their behalf — all updating live via Kubernetes
watches.

## Features

- **ResourceGraphDefinition list and detail**: generated kind and API version,
  state, conditions, the composed resources ordered by kro's published
  topological order (with dependency and externalRef annotations), and a
  flattened SimpleSchema summary.
- **Instance views for generated APIs**: each Active RGD's generated CRD is
  discovered dynamically; instances get a list on the RGD detail page and a
  detail page with conditions, spec, and Headlamp's standard edit/delete
  actions.
- **Sub-resources with resolved values**: the resources kro created for an
  instance (found via kro's ownership labels), each with health, a link to its
  native Headlamp page, and the environment-resolved values that matter —
  PVC storageClassName, Deployment ready count, Service type.
- **Map integration**: a kro source for Headlamp's Map view showing RGDs,
  instances, and kro-managed resources; detail pages deep-link into the Map
  focused on the matching node.
- **Embedded graphs on detail pages**: the RGD detail page renders the
  template DAG and the instance detail page renders the live resource graph.
  On hosts that expose Headlamp's Map renderer to plugins
  ([headlamp#6992](https://github.com/kubernetes-sigs/headlamp/pull/6992),
  newer than Headlamp 0.44.0) these use
  Headlamp's own GraphView — with KubeIcons and the standard node details
  panel; older hosts get a lightweight built-in renderer automatically.
- **New Instance**: opens Headlamp's YAML editor pre-filled with a minimal
  valid instance derived from the RGD's SimpleSchema.
- **Graceful degradation**: a friendly install pointer when kro is not on the
  cluster, and per-section RBAC degradation instead of broken pages.

## Known limitations

When the embedded graphs use Headlamp's native GraphView (hosts newer than
Headlamp 0.44.0), the view behaves like the global Map it is built from:

- it adds `?node=` and `?group=` query parameters to the detail page URL
  (harmless to the plugin's routes, and node selection participates in
  browser history);
- opening a page with an embedded graph resets Headlamp's global namespace
  filter, exactly as visiting the Map view does;
- the Map chrome (source picker, namespace filter, grouping chips) is shown
  above the graph and other enabled Map sources can contribute related nodes
  to the visible graph — the instance graph therefore shows the instance in
  its kro context (its RGD and sibling instances included).

These are upstream behaviors of the exposed renderer, tracked in
[headlamp#7242](https://github.com/kubernetes-sigs/headlamp/issues/7242)
(requesting an opt-in embedded mode).

## Screenshots

The embedded graphs below show Headlamp's native GraphView (hosts newer than
Headlamp 0.44.0); on older hosts the plugin renders the same graphs with its
built-in fallback renderer.

| ResourceGraphDefinitions | Embedded template graph (RGD detail) |
| --- | --- |
| ![RGD list](https://raw.githubusercontent.com/headlamp-k8s/plugins/main/kro/docs/rgd-list.png) | ![Template graph](https://raw.githubusercontent.com/headlamp-k8s/plugins/main/kro/docs/template-graph.png) |

| Embedded instance graph | Node details opened from the graph |
| --- | --- |
| ![Instance graph](https://raw.githubusercontent.com/headlamp-k8s/plugins/main/kro/docs/instance-graph.png) | ![Instance node details](https://raw.githubusercontent.com/headlamp-k8s/plugins/main/kro/docs/instance-node-details.png) |

| Instance sub-resources (resolved storageClass) | Map view |
| --- | --- |
| ![Instance sub-resources](https://raw.githubusercontent.com/headlamp-k8s/plugins/main/kro/docs/instance-subresources.png) | ![Map](https://raw.githubusercontent.com/headlamp-k8s/plugins/main/kro/docs/map.png) |

## Installation

### Desktop app

Install from the Plugin Catalog once published to Artifact Hub, or install a
release tarball into your Headlamp plugins directory.

### Development

Clone this repository, then:

```bash
cd kro
npm install
npm run start
```

Open your local Headlamp (desktop app or dev instance) and the "kro" section
appears in the sidebar. To try the views against real data, install kro and
apply an RGD — see the [kro getting started guide](https://kro.run/docs/getting-started/Installation/).
