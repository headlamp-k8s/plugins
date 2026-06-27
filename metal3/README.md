# Metal3 Headlamp Plugin

A [Headlamp](https://headlamp.dev) plugin that adds a Metal3 section to the UI for viewing
bare-metal infrastructure through Kubernetes.

[Metal3](https://metal3.io) manages bare-metal hosts as Kubernetes resources. This plugin surfaces
those resources in Headlamp with list and detail views, so operators can inspect their bare-metal
estate without dropping to `kubectl`.

> Status: early / in progress. See [Current scope](#current-scope) and [Limitations](#limitations).

## Current scope

- **BareMetalHost**
  - List view with a composite **Status** column that combines the host's operational status
    (the headline signal), its provisioning state, and any error type into a single cell. A host
    that is provisioned but in error is therefore shown as both at once, which a single-value
    column cannot do.
  - Detail view with configuration, status, consumer, power state, and BMC fields.
- Graceful handling when the Metal3 CRDs are not installed in the connected cluster: the views
  show an explanatory message instead of an empty or erroring screen.

## Prerequisites

- [Headlamp](https://headlamp.dev) (desktop app or in-cluster).
- A Kubernetes cluster whose API has the Metal3 `baremetal-operator` CRDs installed, in
  particular `baremetalhosts.metal3.io`. If those CRDs are absent, the plugin indicates that the
  operator is not installed rather than showing an empty view. To stand up Metal3 and provision a
  host, see the Metal3 [Try it](https://book.metal3.io/developer_environment/tryit) getting-started
  guide.

## Limitations

- Read-only for now: no mutating actions (power on/off, reboot, detach) yet.
- Only the BareMetalHost resource is implemented. The cluster-api-provider-metal3 resources
  (Metal3Machine, Metal3Cluster, and the rest), the resource-relationship map, and mutating
  actions are planned.

## Development

Install dependencies and start a watch build:

```bash
npm install
npm start
```

Then run Headlamp (the desktop app or a build from source) pointed at a cluster that has the
Metal3 CRDs; the plugin's "Metal3" entry appears in the sidebar.

A sample BareMetalHost manifest for local testing is in
[`test-files/baremetalhost.yaml`](./test-files/baremetalhost.yaml):

```bash
kubectl apply -f test-files/baremetalhost.yaml
```

Other useful commands:

```bash
npm run build   # production build to dist/
npm run tsc     # type-check
npm test        # unit tests (vitest)
npm run lint    # lint
```

For general Headlamp plugin development, see the
[plugin documentation](https://headlamp.dev/docs/latest/development/plugins/).

## License

Apache License 2.0.
