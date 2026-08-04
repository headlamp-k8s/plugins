# Kueue Headlamp Plugin

This plugin adds an initial Headlamp UI for [Kueue](https://kueue.sigs.k8s.io/docs/overview/), a Kubernetes-native system for batch workload queueing.

See the [Kueue getting started guide](https://kueue.sigs.k8s.io/docs/getting-started/) to install Kueue and create the queueing resources required by a cluster.

## Current Scope

This plugin currently reads Kueue `Cohort`, `ClusterQueue`, `LocalQueue`, and `ResourceFlavor` resources from the Kubernetes API and displays them in list and detail pages. It registers a Kueue sidebar section with entries for these resources.

The views are read-only. Cohort pages show parent and child Cohort relationships, member ClusterQueues, ResourceFlavor references, resource groups, and fair-sharing values.

Kueue resources such as `Workload` and additional queueing views will be added in later PRs.

## Prerequisites

Kueue CRDs must be installed in the cluster before the plugin can list resources. See the [Kueue installation guide](https://kueue.sigs.k8s.io/docs/getting-started/installation/) for installation instructions.

You can check for the `Cohort`, `ClusterQueue`, `LocalQueue`, and `ResourceFlavor` CRDs and resources with:

```bash
kubectl get crd cohorts.kueue.x-k8s.io
kubectl get crd clusterqueues.kueue.x-k8s.io
kubectl get crd localqueues.kueue.x-k8s.io
kubectl get crd resourceflavors.kueue.x-k8s.io
kubectl get cohorts
kubectl get cohort default -o yaml
kubectl get clusterqueues
kubectl get localqueues -A
kubectl get localqueue <name> -n <namespace> -o yaml
kubectl get resourceflavors
```

## Test Files

Sample `Cohort`, `ClusterQueue`, `LocalQueue`, and `ResourceFlavor` manifests are available in `test-files/deploy/`. The sample ClusterQueue belongs to the `default` Cohort.

Apply them to a cluster with Kueue installed:

```bash
kubectl apply -f test-files/deploy/resourceflavor-default.yaml
kubectl apply -f test-files/deploy/resourceflavor-spot.yaml
kubectl apply -f test-files/deploy/resourceflavor-topology.yaml
kubectl apply -f test-files/deploy/cohort-default.yaml
kubectl apply -f test-files/deploy/clusterqueue-team-a.yaml
kubectl apply -f test-files/deploy/localqueue-team-a.yaml
kubectl get cohorts
```

After applying the examples, open `Kueue` > `Cohorts`, `Kueue` > `ClusterQueues`, `Kueue` > `LocalQueues`, or `Kueue` > `ResourceFlavors` in Headlamp.

## Development

```bash
npm install
npm run build
npm run tsc
npm run lint
```
