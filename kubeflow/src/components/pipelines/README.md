# Kubeflow Pipelines Plugin — Operator & SRE Guide

A Headlamp plugin that gives **platform operators and SREs** deep Kubernetes-native visibility into the Kubeflow Pipelines (KFP) control plane without relying on the KFP UI or external databases. The focus is on **operational health, auditability, and fast root-cause discovery** for pipeline orchestrations.

---

## What It Gives You

This plugin surfaces the Kubernetes-side truth for KFP — which pipelines exist, which versions are active, what runs are failing, where artifacts are stored, and which namespaces are affected. It prioritizes operational questions that the standard KFP dashboard often obscures:

- **Is KFP installed correctly?** — Verifies API group discovery and tracks the health of control plane deployments (ml-pipeline, etc.).
- **What failed and why?** — Aggregates failures across all runs and versions, surfacing the exact Kubernetes pod conditions and reasons.
- **Where is our data?** — Discovers and maps `pipelineRoot` storage across namespaces to audit artifact consistency.
- **Multi-Version Support** — Transparently supports both modern KFP v2 (`v2beta1`) and legacy KFP v1 (`v1beta1`) installations.

## What It Offers

### Pipelines Dashboard (`/kubeflow/pipelines`)

An operator-focused overview with:

- **Summary Cards** — Quick glance at total Pipelines, Versions, Runs, Recurring Runs, Experiments, and Namespaces.
- **KFP Control Plane** — Discovery details showing the active API mode, service endpoints, and namespace distribution.
- **KFP Deployments** — Health table showing replica status for `ml-pipeline` and related system deployments.
- **Recent Failures Table** — Instant triage of the latest failed pipelines, versions, and runs across the whole cluster.
- **RBAC & Access** — Visibility into which Pipelines resources your current identity can list.

### Pipelines List & Detail (`/kubeflow/pipelines/list`)

**List View:**

- Summarizes pipelines with status badges, descriptions, and quick-links to the latest active version.

**Detail View:**

- **Pipeline Definition** — Summary of package URLs, SDK versions, task counts, and executor lists.
- **Related Versions** — Interactive list of all versions associated with the pipeline.
- **Version Comparison** — Side-by-side YAML comparison between the **Latest** and **Previous** version specifications.
- **Raw Spec & Conditions** — Full CRD inspection and resource conditions.

### Pipeline Versions List & Detail (`/kubeflow/pipelines/versions`)

- **Source Attribution** — Identifies if a version originates from a remote URI, a code source URL, or an embedded spec.
- **Orchestration Details** — Lists executors and tasks defined in the version's DAG.

### Runs List & Detail (`/kubeflow/pipelines/runs`)

- **Real-time Tracking** — State-aware status badges (Running, Succeeded, Failed, Skipped).
- **Durations** — Precise calculation of run time based on Kubernetes timestamps.
- **Artifact Storage** — Direct visibility into the `pipelineRoot` for the specific run.

### Recurring Runs (`/kubeflow/pipelines/recurring`)

- **Schedule Inspection** — Human-friendly parsing of Cron schedules and interval triggers.
- **Operational State** — Tracks enabled/disabled status and shows next-scheduled run times.

### Artifacts (`/kubeflow/pipelines/artifacts`)

- **Storage Discovery** — Unique view that aggregates all `pipelineRoot` paths discovered across recent runs to identify artifact storage patterns.

## Data Integrity

All data flows directly through the Kubernetes API Server via KFP CRDs. Unlike the KFP UI, this plugin requires no access to the KFP backend database (MySQL/PostgreSQL) or the KFP API service:

```
Headlamp Backend → Kubernetes API Server → CRD API Groups
  /apis/pipelines.kubeflow.org/v2beta1  (KFP v2)
  /apis/pipelines.kubeflow.org/v1beta1  (KFP v1)
```

The `SectionPage` wrapper performs group-level discovery. If the `pipelines.kubeflow.org` group is missing or permissions are insufficient, the UI provides a clear guided error message instead of an empty screen.

---

## Developer Testing Guide

### Prerequisites

- [kind](https://kind.sigs.k8s.io/) or [minikube](https://minikube.sigs.k8s.io/)
- `kubectl` configured
- Node.js 18+

### Step 1: Create a Local Cluster

```bash
kind create cluster --name headlamp-kubeflow
kubectl config use-context kind-headlamp-kubeflow
```

### Step 2: Install CRDs

Apply the modern KFP v2beta1 CRDs (no controllers needed for UI development):

```bash
# Apply Pipelines CRDs using Kustomize directly from upstream
kubectl apply -k "https://github.com/kubeflow/pipelines/manifests/kustomize/cluster-scoped-resources?ref=2.2.0"
```

### Step 3: Create Test Data

Create a namespace and apply sample pipeline resources:

```bash
kubectl create namespace kubeflow-user
```

**Apply Sample Pipeline & Version:**

```bash
cat <<EOF | kubectl apply -f -
apiVersion: pipelines.kubeflow.org/v2beta1
kind: Pipeline
metadata:
  name: demo-pipeline
  namespace: kubeflow-user
spec:
  displayName: "Demo Training Pipeline"
  description: "A sample pipeline for testing the Headlamp UI"
---
apiVersion: pipelines.kubeflow.org/v2beta1
kind: PipelineVersion
metadata:
  name: demo-pipeline-v1
  namespace: kubeflow-user
spec:
  displayName: "v1.0.0"
  pipelineName: demo-pipeline
  description: "Initial version"
  pipelineSpec:
    sdkVersion: "kfp-2.4.0"
    pipelineInfo:
      name: "demo-training"
    root:
      dag:
        tasks:
          preprocess: {}
          train: {}
          evaluate: {}
EOF
```

**Apply Sample Experiment & Run:**

```bash
cat <<EOF | kubectl apply -f -
apiVersion: pipelines.kubeflow.org/v2beta1
kind: Experiment
metadata:
  name: test-experiment
  namespace: kubeflow-user
spec:
  displayName: "Frontend Validation"
  description: "Experiment for UI testing"
---
apiVersion: pipelines.kubeflow.org/v2beta1
kind: Run
metadata:
  name: sample-run-001
  namespace: kubeflow-user
spec:
  displayName: "Nightly Training #001"
  pipelineName: demo-pipeline
  pipelineVersionName: demo-pipeline-v1
  experimentName: test-experiment
  runtimeConfig:
    pipelineRoot: "s3://my-bucket/kfp-artifacts"
status:
  state: SUCCEEDED
  startTime: "2024-01-01T10:00:00Z"
  completionTime: "2024-01-01T10:15:00Z"
EOF
```

### Step 4: Run the Plugin

```bash
cd plugins/kubeflow
npm install
npm run start     # Watches for changes, auto-deploys to ~/.config/Headlamp/plugins/
```

### Step 5: Verify

1.  Open Headlamp.
2.  Navigate to **Kubeflow** → **Pipelines**.
3.  Verify the Dashboard summary cards reflect the test data.
4.  Navigate to **Pipelines**, **Versions**, **Runs**, and **Artifacts** to verify detail views.

---

## Running Tests

### Unit Tests

```bash
cd plugins/kubeflow
npm test
```

Tests cover critical utility functions in `pipelineUtils.ts`:

- `getPipelineResourceStatus` — Consistent badge derivation from phases and conditions.
- `getPipelineRunDuration` — Millisecond-precise duration parsing.
- `getRecurringRunSchedule` — Parsing of Cron strings and interval-second objects.

### Storybook

```bash
cd plugins/kubeflow
npm run storybook
```

Storybook stories use isolated components and the `TestProvider` to simulate a Kubernetes environment. Available stories:

- `Kubeflow/Pipelines/Overview` — Complete dashboard view
- `Kubeflow/Pipelines/PipelinesList` — Resource list view
- `Kubeflow/Pipelines/PipelineDetail` — Deep inspection view
- `Kubeflow/Pipelines/Artifacts` — Storage discovery view

---

## Cleanup

```bash
kubectl delete namespace kubeflow-user
kubectl delete -k "github.com/kubeflow/pipelines/manifests/kustomize/cluster-scoped-resources?ref=2.2.0"
kind delete cluster --name headlamp-kubeflow
```
