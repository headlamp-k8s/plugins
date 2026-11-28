# Hubble

See the network traffic that [Cilium Hubble](https://docs.cilium.io/en/stable/observability/hubble/) records between pods, right in Headlamp.

This plugin is at an early stage. It adds:

- A **Hubble** page in the sidebar that checks whether the cluster has what the plugin reads from: Cilium, through the `ciliumnetworkpolicies.cilium.io` CRD, and Hubble Relay, through a `hubble-relay` Service in any namespace.
- A **Connections (Hubble)** table on each Pod's page with the pod's recent traffic: who it talked to, on which port, and whether it was delivered, blocked by a policy, or left the cluster. For TCP a row counts the observed connection attempts, each once, even when Hubble recorded it at several points or on two nodes. For other protocols, like UDP, it counts the observed flow events. Peers that aren't pods are named where Cilium knows them, like the node (where kubelet probes come from) or the Kubernetes API server, and the table pauses while the browser tab is hidden. The table only shows up on clusters where the Cilium CRD is found, checked again every 10 seconds, so clusters without Cilium get no table and no requests to the adapter.

The plan is discussed in [kubernetes-sigs/headlamp#8007](https://github.com/kubernetes-sigs/headlamp/issues/8007). Views for the Cilium resources themselves (network policies, endpoints, identities) are already covered by the third-party [Cilium plugin](https://github.com/batuhancikrikci/headlamp-plugins/tree/main/cilium), so this plugin doesn't add them.

## Requirements

A cluster that uses Cilium as its network plugin, with Hubble and Hubble Relay enabled.

The Connections table also needs the `hubble-flows-adapter` in the cluster, see below.

## The flows adapter

Hubble Relay only speaks gRPC, which a browser can't use through the Kubernetes API server. The [adapter](adapter) is a small service that runs next to Relay, asks it for the recent flows of one namespace or pod, and returns the few fields the plugin needs as JSON. The plugin reaches it through the API server's Service proxy, so no extra port is opened.

Build the image from the `adapter` directory and deploy it:

```bash
docker build -t hubble-flows-adapter:dev adapter
kubectl apply -f adapter/deploy/hubble-flows-adapter.yaml
```

The manifest runs it in `kube-system` and expects Relay at `hubble-relay.kube-system.svc:80` without TLS, which is Cilium's default. If Relay's server TLS is on, Relay listens on port 443: put the CA that signed its certificate in a Secret, plus a client certificate when Relay asks for one, mount it and set the `-relay-tls-*` flags, as the comments in the manifest show. Run the adapter with `-help` to see every flag.

If the adapter's Service has another name, namespace or port, set them in the plugin's settings (Settings > Plugins > hubble).

### Who can see flows

This first version is for cluster operators. The API server doesn't tell the adapter who is asking, so the adapter can't limit flows per user. Anyone who can use `services/proxy` on the adapter's Service can read the flows of every namespace. Only give that permission to people who may see all of the cluster's traffic, which is normally cluster admins.

The manifest also has a CiliumNetworkPolicy that only lets the API server and the adapter's own node call the adapter, so pods can't read the flows by calling it directly. The node is let in for the kubelet's health checks, and Cilium lets a node reach its own pods anyway, so programs on that node that use the host network still can. If your API server reaches pods through a proxy like konnectivity, its requests come from that proxy instead and the table says it couldn't get the flows. The comment in the manifest shows how to find where they come from, so you can allow that in the policy.

### What Hubble remembers

Hubble keeps a limited number of recent flows on each node (4095 by default). The table shows the time range it covers. On a busy cluster that can be a few seconds, and a busy node covers less time than a quiet one, so older connections may only be seen from one side. When Relay can't read a node, the table says which one, since that node's flows are missing.

## Developing Headlamp plugins

For more information on developing Headlamp plugins, please refer to:

- [Getting Started](https://headlamp.dev/docs/latest/development/plugins/), How to create a new Headlamp plugin.
- [API Reference](https://headlamp.dev/docs/latest/development/api/), API documentation for what you can do
- [UI Component Storybook](https://headlamp.dev/docs/latest/development/frontend/#storybook), pre-existing components you can use when creating your plugin.
- [Plugin Examples](https://github.com/kubernetes-sigs/headlamp/tree/main/plugins/examples), Example plugins you can look at to see how it's done.
