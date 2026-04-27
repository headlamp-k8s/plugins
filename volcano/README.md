# Volcano Headlamp Plugin

This [Headlamp](https://headlamp.dev/) plugin adds Volcano resources to the Headlamp UI so Kubernetes operators can inspect batch scheduling state with list and detail pages.

Upstream issue: [kubernetes-sigs/headlamp#4359](https://github.com/kubernetes-sigs/headlamp/issues/4359)

## Features

### Current Features

- **Volcano Jobs** (`batch.volcano.sh/v1alpha1`)

  - List view with status, queue, running/min-available, task count, and age
  - Detail view with summary info, Pod status section, tasks section, and events
  - Queue link and related PodGroup link from job detail (when available)

- **Volcano Queues** (`scheduling.volcano.sh/v1beta1`)

  - List view with state, weight, parent, and age
  - Detail view with capacity limits, allocated resources, and events
  - Parent queue navigation links

- **Volcano PodGroups** (`scheduling.volcano.sh/v1beta1`)

  - List view with phase, min member, running count, queue, and age
  - Detail view with progress, conditions, min resources, and events
  - Fallback message when conditions are not reported

- **Volcano JobTemplates** (`flow.volcano.sh/v1alpha1`)

  - List view with queue, scheduler, retry settings, task count, and generated Jobs
  - Detail view with tasks, policies, plugins, network topology, related JobFlows, and generated Jobs

- **Volcano JobFlows** (`flow.volcano.sh/v1alpha1`)

  - List view with status, retain policy, flow count, generated Jobs, and phase counts
  - Detail view with flow steps, dependency probes, generated Jobs, conditions, and running histories

- **Plugin Navigation and UX**
  - Dedicated `Volcano` sidebar section in Headlamp
  - Consistent status color rendering across Jobs, Queues, and PodGroups

### Planned Features

- Pending jobs dashboard and richer "why pending" diagnostics
- Advanced gang-scheduling visualization
- Metrics-focused views and additional operational dashboards

## Volcano CRDs Supported

| CRD         | API Group                       |
| ----------- | ------------------------------- |
| Job         | `batch.volcano.sh/v1alpha1`     |
| Queue       | `scheduling.volcano.sh/v1beta1` |
| PodGroup    | `scheduling.volcano.sh/v1beta1` |
| JobTemplate | `flow.volcano.sh/v1alpha1`      |
| JobFlow     | `flow.volcano.sh/v1alpha1`      |

## Demo

https://github.com/user-attachments/assets/fbdef40e-2130-4e4e-bb18-a93dd129c834

# Testing the plugin

## Prerequisites

- Node.js and npm
- A Kubernetes cluster with [Volcano installed](https://volcano.sh/en/docs/installation/)
- [Headlamp](https://headlamp.dev/) (desktop app or in-cluster deployment)

## Steps to Test

1. Clone this repository:

   ```bash
   git clone https://github.com/headlamp-k8s/plugins.git
   ```

2. Navigate to the plugin directory:

   ```bash
   cd volcano
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start plugin development mode:

   ```bash
   npm run start
   ```

5. Launch Headlamp. You should now see `Volcano` in the sidebar.

## Generate Volcano Resources for Testing

Apply the included test manifests:

```bash
kubectl apply -f test-files/deploy/namespace.yaml
kubectl apply -f test-files/deploy/queue.yaml
kubectl apply -f test-files/deploy/job-running.yaml
kubectl apply -f test-files/deploy/job-completed.yaml
kubectl apply -f test-files/deploy/job-unschedulable.yaml
kubectl apply -f test-files/deploy/job-failed.yaml
kubectl apply -f test-files/deploy/jobtemplate-step-a.yaml
kubectl apply -f test-files/deploy/jobtemplate-step-b.yaml
kubectl apply -f test-files/deploy/jobflow.yaml
```

These manifests create scenarios for:

- normal/running job
- completed job
- unschedulable job (resource pressure)
- failed job
- JobTemplates and a dependent JobFlow that generates two Volcano Jobs

### Verify from CLI

```bash
kubectl get vcjob -n volcano-lab
kubectl get queue volcano-lab-queue
kubectl get podgroups.scheduling.volcano.sh -n volcano-lab
kubectl get jobtemplates.flow.volcano.sh -n volcano-lab
kubectl get jobflows.flow.volcano.sh -n volcano-lab
```

### Verify in Headlamp

- Open `Volcano > Jobs`, `Volcano > JobTemplates`, `Volcano > JobFlows`, `Volcano > Queues`, and `Volcano > PodGroups`.
- Confirm list pages render expected status/columns.
- Open detail pages and verify section content and events rendering.
- Verify cross-links:
  - Job -> Queue
  - Job -> PodGroup (when available)
  - JobFlow -> JobTemplate
  - JobFlow -> generated Job
  - JobTemplate -> JobFlow
  - JobTemplate -> generated Job
  - PodGroup -> Queue

## Clean Up Test Resources

```bash
kubectl delete -f test-files/deploy/jobflow.yaml
kubectl delete -f test-files/deploy/jobtemplate-step-b.yaml
kubectl delete -f test-files/deploy/jobtemplate-step-a.yaml
kubectl delete -f test-files/deploy/job-failed.yaml
kubectl delete -f test-files/deploy/job-unschedulable.yaml
kubectl delete -f test-files/deploy/job-completed.yaml
kubectl delete -f test-files/deploy/job-running.yaml
kubectl delete -f test-files/deploy/queue.yaml
kubectl delete -f test-files/deploy/namespace.yaml
```

## Development Commands

```bash
npm run start
npm run tsc
npm run lint
npm run build
```

## Feedback and Questions

- Please open an issue in this repository for bugs, feature requests, or feedback.
- For Headlamp-wide plugin discussions, you can also use the `#headlamp` channel in Kubernetes Slack.

## References

- [Headlamp plugin development docs](https://headlamp.dev/docs/latest/development/plugins/)
- [Volcano documentation](https://volcano.sh/en/docs/)
