# Kueue Headlamp Plugin

This plugin adds an initial Headlamp UI for [Kueue](https://kueue.sigs.k8s.io/docs/overview/), a Kubernetes-native system for batch workload queueing.

See the [Kueue getting started guide](https://kueue.sigs.k8s.io/docs/getting-started/) to install Kueue and create the queueing resources required by a cluster.

## Current Scope

This plugin currently reads Kueue `ClusterQueue`, `LocalQueue`, `ResourceFlavor`, `Workload`, and `WorkloadPriorityClass` resources from the Kubernetes API and displays them in basic list and detail pages. It registers a Kueue sidebar section with entries for these resources.

Additional Kueue resources and queueing views will be added in later PRs.

## Prerequisites

Kueue CRDs must be installed in the cluster before the plugin can list resources. See the [Kueue installation guide](https://kueue.sigs.k8s.io/docs/getting-started/installation/) for installation instructions.

You can check for the Kueue CRDs and resources with:

```bash
kubectl get crd clusterqueues.kueue.x-k8s.io
kubectl get crd localqueues.kueue.x-k8s.io
kubectl get crd resourceflavors.kueue.x-k8s.io
kubectl get crd workloads.kueue.x-k8s.io
kubectl get crd workloadpriorityclasses.kueue.x-k8s.io
kubectl get clusterqueues
kubectl get localqueues -A
kubectl get resourceflavors
kubectl get workloads -A
kubectl get workloadpriorityclasses
```

## Test Files

Sample manifests for Kueue resources are available in `test-files/deploy/`.

Apply them to a cluster with Kueue installed:

```bash
kubectl apply -f test-files/deploy/resourceflavor-default.yaml
kubectl apply -f test-files/deploy/resourceflavor-spot.yaml
kubectl apply -f test-files/deploy/resourceflavor-topology.yaml
kubectl apply -f test-files/deploy/clusterqueue-team-a.yaml
kubectl apply -f test-files/deploy/localqueue-team-a.yaml
kubectl apply -f test-files/deploy/workloadpriorityclass-sample.yaml
```

After applying the examples, you can view them under the **Kueue** section in the Headlamp sidebar.

## Development

```bash
npm install
npm run build
npm run tsc
npm run lint
```
