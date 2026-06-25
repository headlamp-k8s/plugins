# Kueue Headlamp Plugin

This plugin adds an initial Headlamp UI for [Kueue](https://kueue.sigs.k8s.io/docs/overview/), a Kubernetes-native system for batch workload queueing.

See the [Kueue getting started guide](https://kueue.sigs.k8s.io/docs/getting-started/) to install Kueue and create the queueing resources required by a cluster.

## Current Scope

This first skeleton focuses on reading Kueue `ResourceFlavor` resources from the Kubernetes API and displaying them in a basic list page. It registers a Kueue sidebar section with a `ResourceFlavors` entry.

Kueue resources such as `ClusterQueue`, `LocalQueue`, `Workload`, and additional queueing views will be added in later PRs.

## Prerequisites

Kueue CRDs must be installed in the cluster before the plugin can list resources.

You can check for the `ResourceFlavor` CRD and resources with:

```bash
kubectl get crd resourceflavors.kueue.x-k8s.io
kubectl get resourceflavors
```

## Development

```bash
npm install
npm run build
npm run tsc
npm run lint
```
