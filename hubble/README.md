# Hubble

See the network traffic that [Cilium Hubble](https://docs.cilium.io/en/stable/observability/hubble/) records between pods, right in Headlamp.

This plugin is at an early stage. For now it adds a **Hubble** page to the sidebar that checks whether the cluster has what the plugin reads from:

- Cilium, through the `ciliumnetworkpolicies.cilium.io` CRD
- Hubble Relay, through a `hubble-relay` Service in any namespace

Planned next, as discussed in [kubernetes-sigs/headlamp#8007](https://github.com/kubernetes-sigs/headlamp/issues/8007):

1. Traffic between workloads on the Map, from Hubble's flow metrics in Prometheus.
2. Recent flows for a pod on its details page, from Hubble Relay.

Views for the Cilium resources themselves (network policies, endpoints, identities) are already covered by the third-party [Cilium plugin](https://github.com/batuhancikrikci/headlamp-plugins/tree/main/cilium), so this plugin doesn't add them.

## Requirements

A cluster that uses Cilium as its network plugin, with Hubble enabled.

## Developing Headlamp plugins

For more information on developing Headlamp plugins, please refer to:

- [Getting Started](https://headlamp.dev/docs/latest/development/plugins/), How to create a new Headlamp plugin.
- [API Reference](https://headlamp.dev/docs/latest/development/api/), API documentation for what you can do
- [UI Component Storybook](https://headlamp.dev/docs/latest/development/frontend/#storybook), pre-existing components you can use when creating your plugin.
- [Plugin Examples](https://github.com/kubernetes-sigs/headlamp/tree/main/plugins/examples), Example plugins you can look at to see how it's done.
