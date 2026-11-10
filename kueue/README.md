# Kueue Headlamp Plugin

This plugin adds an initial Headlamp UI for [Kueue](https://kueue.sigs.k8s.io/docs/overview/), a Kubernetes-native system for batch workload queueing.

See the [Kueue getting started guide](https://kueue.sigs.k8s.io/docs/getting-started/) to install Kueue and create the queueing resources required by a cluster.

## Current Scope

This plugin currently reads Kueue `Cohort`, `ClusterQueue`, `LocalQueue`, `ResourceFlavor`, and `Workload` resources from the Kubernetes API and displays them in basic list and detail pages. It registers a Kueue sidebar section with entries for these resources.

The views are read-only. Cohort pages show parent and child Cohort relationships, member ClusterQueues, ResourceFlavor references, resource groups, and fair-sharing values.

Related Cohorts, ClusterQueues, LocalQueues, ResourceFlavors, and Workloads are linked so users can follow the queueing path between resources. The plugin checks Kubernetes permissions before loading resource pages and shows an access message when the current user cannot view a resource.

## Prerequisites

Kueue CRDs must be installed in the cluster before the plugin can list resources. See the [Kueue installation guide](https://kueue.sigs.k8s.io/docs/getting-started/installation/) for installation instructions.

You can check for the `Cohort`, `ClusterQueue`, `LocalQueue`, `ResourceFlavor`, and `Workload` CRDs and resources with:

```bash
kubectl get crd cohorts.kueue.x-k8s.io
kubectl get crd clusterqueues.kueue.x-k8s.io
kubectl get crd localqueues.kueue.x-k8s.io
kubectl get crd resourceflavors.kueue.x-k8s.io
kubectl get crd workloads.kueue.x-k8s.io
kubectl get cohorts
kubectl get cohort default -o yaml
kubectl get clusterqueues
kubectl get localqueues -A
kubectl get localqueue <name> -n <namespace> -o yaml
kubectl get resourceflavors
kubectl get workloads -A
kubectl get workload <name> -n <namespace> -o yaml
```

## Test Files

Sample `Cohort`, `ClusterQueue`, `LocalQueue`, `ResourceFlavor`, and Job manifests are available in `test-files/deploy/`. The sample ClusterQueue belongs to the `default` Cohort, and the sample Job uses the `team-a-queue` LocalQueue so Kueue can create a real `Workload` for local UI testing.

Apply them to a cluster with Kueue installed:

```bash
kubectl apply -f test-files/deploy/resourceflavor-default.yaml
kubectl apply -f test-files/deploy/resourceflavor-spot.yaml
kubectl apply -f test-files/deploy/resourceflavor-topology.yaml
kubectl apply -f test-files/deploy/cohort-default.yaml
kubectl apply -f test-files/deploy/clusterqueue-team-a.yaml
kubectl apply -f test-files/deploy/localqueue-team-a.yaml
kubectl apply -f test-files/deploy/job-sample-workload.yaml
kubectl get cohorts
kubectl get workloads -A
```

After applying the examples, open `Kueue` > `Cohorts`, `Kueue` > `ClusterQueues`, `Kueue` > `LocalQueues`, `Kueue` > `ResourceFlavors`, or `Kueue` > `Workloads` in Headlamp.

### Scenarios

`test-files/scenarios/` sets up Workloads in the states the plugin explains, including the error conditions. Each scenario has its own namespace, ClusterQueue and LocalQueue, and only needs `test-files/deploy/resourceflavor-default.yaml` to be applied first. Remove a scenario with `kubectl delete -f test-files/scenarios/<name>/`.

- `waiting-for-quota`: `kubectl apply -f test-files/scenarios/waiting-for-quota/`. One of `job-a` and `job-b` is admitted and the other is blocked on Waiting for quota. `too-big-job` is also blocked there, since it asks for more than the ClusterQueue has.
- `admission-checks`: `kubectl apply -f test-files/scenarios/admission-checks/`. The `admission-checks` ClusterQueue is inactive because the `scenario-approval` AdmissionCheck is not Active, so `needs-approval-job` is Inadmissible. Mark the check Active (below) and `needs-approval-job` is blocked on Admission checks. Approve it (below) and it is admitted.
- `deactivated`: `kubectl apply -f test-files/scenarios/deactivated/`, wait for `deactivated-job` to be admitted, then deactivate the Workload (below). `deactivated-job` is Deactivated, with an eviction in its timeline.
- `preemption`: `kubectl apply -f test-files/scenarios/preemption/scenario.yaml`, wait for `low-priority-job` to be admitted, then `kubectl apply -f test-files/scenarios/preemption/high-priority-job.yaml`. `high-priority-job` is admitted, and `low-priority-job` is Evicted by preemption, requeued, and waits for quota.
- `inadmissible`: `kubectl apply -f test-files/scenarios/inadmissible/`. `held-queue-job` uses a stopped ClusterQueue and `missing-queue-job` a LocalQueue that does not exist. Both are blocked on Waiting for quota with reason Inadmissible, and Kueue's message names the cause.
- `owners`: `kubectl apply -f test-files/scenarios/owners/`. Workloads owned by a Job and by a plain Pod, with links to their owners on the Workload detail page. Needs Kueue's `pod` integration enabled.

Commands for the manual steps:

```bash
# admission-checks: play the AdmissionCheck controller and mark the check Active
kubectl patch admissioncheck scenario-approval --subresource=status --type=merge \
  -p '{"status":{"conditions":[{"type":"Active","status":"True","reason":"Active","message":"Marked Active by hand","lastTransitionTime":"2026-01-01T00:00:00Z"}]}}'

# admission-checks: approve the Workload
kubectl -n kueue-admission-checks get workloads.kueue.x-k8s.io -o name | \
  xargs -I{} kubectl -n kueue-admission-checks patch {} --subresource=status --type=json \
  -p '[{"op":"replace","path":"/status/admissionChecks/0/state","value":"Ready"}]'

# deactivated: wait for the Workload to be admitted, then deactivate it
kubectl -n kueue-deactivated wait workloads.kueue.x-k8s.io --all --for=condition=Admitted --timeout=60s
kubectl -n kueue-deactivated get workloads.kueue.x-k8s.io -o name | \
  xargs -I{} kubectl -n kueue-deactivated patch {} --type=merge -p '{"spec":{"active":false}}'
```

## Development

```bash
npm install
npm run format
npm run build
npm run tsc
npm run lint
npm run test
```
