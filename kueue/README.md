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

## Troubleshooting a Pending Workload

When a Job submitted to Kueue does not start, follow it from the Job to the queue that is holding it back. The screenshots follow a Job that requests 64 CPUs from a ClusterQueue with a nominal quota of 1 CPU.

1. **Job.** Open the Job in `Workloads` > `Jobs`. The Jobs list has `Queue` and `Kueue Status` columns, and the Job detail page has a `Kueue` section with its LocalQueue, its Workload and the Workload's status. If the section is missing, the Job has no `kueue.x-k8s.io/queue-name` label, so Kueue is not managing it. If the Workload shows `Not created yet`, Kueue has not picked up the Job; check that the LocalQueue exists in the Job's namespace.

   ```bash
   kubectl get job <name> -n <namespace> -o jsonpath='{.metadata.labels.kueue\.x-k8s\.io/queue-name}'
   kubectl get workloads -n <namespace> -l kueue.x-k8s.io/job-uid=$(kubectl get job <name> -n <namespace> -o jsonpath='{.metadata.uid}')
   ```

   <img src="docs/troubleshooting-job.png" alt="Job detail page with the Kueue section and the Why is this Workload not admitted? section" width="800">

2. **Workload.** Open the Workload from the Job's `Kueue` section, or find it in `Kueue` > `Workloads`, where the `Blocked On` column shows the stage for each Workload. The `Why is this Workload not admitted?` section on the Workload page (also shown on the Job page) names the stage it is waiting at, the reason Kueue reported, what that reason means and Kueue's own message:

   - `Not evaluated`: Kueue has not tried to reserve quota yet. The Workload is usually queued behind others.
   - `Waiting for quota`: Kueue has not reserved quota for it yet. This is not always a quota shortage: a stopped or inactive queue, missing configuration or waiting for other Workloads' pods to be ready also keep it here. Read the reason and Kueue's message for the cause before changing any quota.
   - `Admission checks`: quota is reserved but admission checks are not `Ready`. `Blocking admission checks` lists them; open each one from `Kueue` > `AdmissionChecks`.
   - `Topology assignment`: quota is reserved but Kueue is still placing the pods for a topology-aware request.
   - `Evicted`: the Workload was evicted, for example by preemption or an AdmissionCheck requesting a retry, which can happen before admission while quota is reserved. When Kueue backs off before requeueing it, `Next retry` shows when.
   - `Deactivated`: `spec.active` is false, or Kueue is about to set it, so Kueue will not admit the Workload.

   The `Lifecycle` section shows which stages it has passed and how long it has waited at the current one.

   ```bash
   kubectl get workload <name> -n <namespace> -o jsonpath='{range .status.conditions[*]}{.type}={.status} {.reason}: {.message}{"\n"}{end}'
   ```

   <img src="docs/troubleshooting-workloads.png" alt="Kueue Workloads list with the Blocked On column" width="800">

3. **LocalQueue.** Follow the `Queue` link. The LocalQueue page shows its ClusterQueue, its `Stop Policy`, its `Status` and how many Workloads are pending, reserving quota and admitted. A `Stop Policy` of `Hold`, or a `Status` of `Inactive`, stops Kueue from admitting new Workloads from the queue, but Workloads that are already admitted keep running. `HoldAndDrain` also evicts the admitted ones. The Conditions section says why a queue is inactive.

   ```bash
   kubectl get localqueue <name> -n <namespace> -o yaml
   ```

   <img src="docs/troubleshooting-localqueue.png" alt="LocalQueue page with its ClusterQueue, Stop Policy, Workload counts and Status" width="800">

4. **ClusterQueue.** Follow the `ClusterQueue` link. Compare `Resource Groups`, which shows the nominal quota and borrowing limit per ResourceFlavor and resource, with `Flavor Reservations` and `Flavor Usage`, which show how much of it is taken. If the quota is used up, the Workload waits until running Workloads finish, or until the ClusterQueue can borrow from its `Cohort`. `Pending Workloads` counts every Workload waiting across all of its LocalQueues, and the ClusterQueue has its own `Stop Policy` and `Status`.

   ```bash
   kubectl get clusterqueue <name> -o yaml
   ```

   <img src="docs/troubleshooting-clusterqueue.png" alt="ClusterQueue page showing a nominal quota of 1 CPU" width="800">

## Development

```bash
npm install
npm run format
npm run build
npm run tsc
npm run lint
npm run test
```
