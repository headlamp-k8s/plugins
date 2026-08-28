# Kueue Headlamp Plugin

The Kueue plugin brings Kubernetes batch workload queueing and admission visibility into Headlamp.

[Kueue](https://kueue.sigs.k8s.io/) is a Kubernetes-native job queueing system for managing batch workloads and resource sharing. The plugin adds dedicated Headlamp views for the Kueue resources operators use most often, making it easier to inspect queue configuration, workload admission, resource usage, and relationships between resources without moving between multiple `kubectl` commands and raw CRDs.

## Features

### Cohorts

Cohort views show how ClusterQueues share unused resources. List and detail views expose:

- parent and child Cohorts
- member ClusterQueues
- resource groups and referenced ResourceFlavors
- nominal quotas, borrowing limits, and lending limits
- fair-sharing weight and current weighted share

Related Cohorts, ClusterQueues, and ResourceFlavors are linked directly to their Headlamp detail pages.

### ClusterQueues

The ClusterQueue views provide both an overview of queue state and the details behind admission capacity. The plugin shows:

- cohort and queueing strategy
- namespace selection and stop policy
- pending, admitted, and reserving workload counts
- resource groups and referenced ResourceFlavors
- nominal quotas, borrowing limits, and lending limits
- flavor reservations and current flavor usage
- preemption, flavor fungibility, fair sharing, and admission configuration
- Kueue conditions and Kubernetes events
- related LocalQueues and pending or admitted Workloads

Cohort, ResourceFlavor, LocalQueue, and Workload references are linked directly to their Headlamp detail pages.

### LocalQueues

LocalQueues are displayed as namespace-scoped entry points into Kueue. List and detail views expose:

- the associated ClusterQueue
- stop policy and queue status
- pending, admitted, and reserving workload counts
- Kueue conditions and Kubernetes events
- related Workloads in the same namespace

ClusterQueue and Workload references are navigable, so users can move between a namespace queue, the cluster-level capacity backing it, and its workloads.

### ResourceFlavors

ResourceFlavor views expose the scheduling characteristics Kueue can use when assigning resources to admitted workloads, including:

- node labels
- node taints
- tolerations
- topology configuration

### Workloads

The Workloads view provides a namespace-aware overview of Kueue-managed workloads with:

- LocalQueue
- priority and priority class
- active state
- admission state
- completion state
- human-readable workload status

Workload details go further by exposing PodSets, resource requests, admission assignments, assigned ClusterQueue and ResourceFlavors, admission checks, reclaimable pods, requeue information, scheduling statistics, Kueue conditions, and Kubernetes events.

Statuses such as **Admitted**, **Finished**, and **Inadmissible** make it easier to identify where a workload is in the admission lifecycle and investigate why it is not progressing.

## Resource Navigation

The plugin links related Kueue resources where possible:

- Cohort → parent and child Cohorts
- Cohort → member ClusterQueues
- Cohort → ResourceFlavors
- ClusterQueue → Cohort
- ClusterQueue → related LocalQueues
- ClusterQueue → related pending and admitted Workloads
- Workload → LocalQueue
- Workload → assigned ClusterQueue
- LocalQueue → ClusterQueue
- LocalQueue → related Workloads in its namespace
- ClusterQueue → ResourceFlavor

This keeps the queueing path connected while troubleshooting admission, resource sharing, and scheduling state.

Workload owner references are displayed as plain `Kind/name` text and are not currently navigable.

## Kubernetes Permissions

Kueue views respect the Kubernetes credentials currently used by Headlamp. Before rendering a resource page, the plugin checks whether the user can perform the required `list` or `get` operation and displays an access message when permission is unavailable.

## Prerequisites

Kueue CRDs must be installed in the cluster before the plugin can display Kueue resources.

See the [Kueue installation guide](https://kueue.sigs.k8s.io/docs/getting-started/installation/) for installation instructions.

This release provides views for the Kueue `kueue.x-k8s.io/v1beta2` `Cohort`, `ClusterQueue`, `LocalQueue`, `ResourceFlavor`, and `Workload` resources.

## Development

From the `kueue` plugin directory:

```bash
npm install
npm run format
npm run build
npm run tsc
npm run lint
npm run test
```

To create the distributable plugin archive:

```bash
npm run package
```

## Release

This is the initial alpha release of the Kueue plugin for Headlamp: **0.1.0-alpha**.

For the full release notes and demo, see [#1251](https://github.com/headlamp-k8s/plugins/issues/1251).
