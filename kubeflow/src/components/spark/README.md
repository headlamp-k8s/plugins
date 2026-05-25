# Kubeflow Spark Plugin - Operator & SRE Guide

A Headlamp plugin module that provides platform operators, SREs, and ML engineers with deep Kubernetes-native observability over SparkApplication and ScheduledSparkApplication resources without switching between `kubectl` and multiple dashboards.

---

## What It Gives You

This Spark module surfaces the Kubernetes-side truth for Spark workloads:

- **Cluster-wide Visibility**: See all Spark applications across all namespaces in a unified dashboard.
- **Resource Health**: Real-time status badges derived from operator conditions, showing exactly why an application is `Failed`, `Running`, or `Pending`.
- **Driver & Executor Topology**: Inspect the pod relationship, node placement, and container status for every Spark job.
- **Schedule Management**: Monitor recurring jobs, human-readable cron schedules, and historical run success rates.
- **Configuration & RBAC**: Quick access to Spark configuration, environment variables, mounted volumes, and assigned RBAC roles.

The UI maintains a familiar Headlamp/kubectl feel while adding operational context like executor summaries and log access.

## What It Offers

### Spark Overview (`/kubeflow/spark`)

- **Summary Cards**: Total applications, scheduled jobs, and aggregate CPU/Memory/GPU requests.
- **Recent Applications**: A quick-view table of the most recently created or updated Spark jobs.
- **Scheduled Jobs Snapshot**: Overview of recurring job states and next-run timings.
- **Namespace Distribution**: workload density tracking across the cluster.

### Spark Applications (`/kubeflow/spark/sparkapplications`)

#### List View

- Name, namespace, and application type (Python/Scala/Java/R).
- Real-time status badges with hoverable error reasons.
- Resource footprint (CPU/Memory).
- Quick actions for log viewing and raw spec inspection.

#### Detail View

- **Status & Conditions**: Full history of application state transitions.
- **Topology**: Table of driver and executor pods with node info and container statuses.
- **Resource Configuration**: Detailed breakdown of driver and executor specs (cores, memory, instances).
- **Environment & Storage**: Environment variables, ConfigMaps, and Volume mappings.
- **RBAC**: Associated ServiceAccount and Role/ClusterRole relationships.
- **Spec Comparison**: Compare the live running spec against the last applied manifest.

### Scheduled Spark Applications (`/kubeflow/spark/scheduledsparkapplications`)

#### List View

- Name, namespace, and human-readable cron description.
- Status of the scheduler (Active/Suspended).
- Last run success and next scheduled execution time.

#### Detail View

- **Schedule Config**: Concurrency policies, history limits, and suspend state.
- **Template Spec**: The base SparkApplication template used for every run.
- **Run History**: List of recent SparkApplications spawned by this schedule with their statuses.

---

## Routes and Navigation

Sidebar and route names follow the `kubeflow-spark-*` convention:

- `kubeflow-spark-overview`
- `kubeflow-spark-applications-list`
- `kubeflow-spark-applications-detail`
- `kubeflow-spark-scheduled-list`
- `kubeflow-spark-scheduled-detail`

---

## Data Integrity

All Spark data is fetched through the Kubernetes API server from the Spark Operator CRDs:

```text
Headlamp Backend -> Kubernetes API Server -> sparkoperator.k8s.io/v1beta2
  /apis/sparkoperator.k8s.io/v1beta2/sparkapplications
  /apis/sparkoperator.k8s.io/v1beta2/scheduledsparkapplications
```

`SectionPage` performs API-path discovery checks and renders actionable fallback messaging when CRDs are missing or inaccessible.

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

### Step 2: Install Spark Operator CRDs

Apply the CRDs (the controller is optional for UI development):

```bash
kubectl apply --server-side -f https://raw.githubusercontent.com/kubeflow/spark-operator/master/charts/spark-operator-chart/crds/sparkoperator.k8s.io_sparkapplications.yaml
kubectl apply --server-side -f https://raw.githubusercontent.com/kubeflow/spark-operator/master/charts/spark-operator-chart/crds/sparkoperator.k8s.io_scheduledsparkapplications.yaml
```

### Step 3: Create Sample Spark Data

```bash
kubectl apply -f plugins/kubeflow/test_files/spark/demo.yaml
```

### Step 4: Run the Plugin

```bash
cd plugins/kubeflow
npm install
npm run start
```

### Step 5: Verify in Headlamp

1. Open Headlamp and select the `headlamp-kubeflow` cluster.
2. Navigate to **Kubeflow** → **Spark Dashboard**.
3. Verify the overview cards and the "Recent Applications" table.
4. Click into **Spark Applications** and **Scheduled Spark Applications** to test list and detail views.

---

## Running Tests

### Unit Tests

```bash
cd plugins/kubeflow
npm test
```

Spark-specific tests cover:

- Status derivation from complex operator conditions.
- Human-readable cron formatting integration.
- Resource aggregation logic for CPU/Memory/GPU.
- Last-applied spec extraction and comparison.

### Storybook

```bash
cd plugins/kubeflow
npm run storybook
```

Spark stories include:

- `SparkOverview`
- `SparkApplicationsList`
- `SparkApplicationsDetail`
- `ScheduledSparkApplicationsList`
- `ScheduledSparkApplicationsDetail`

---

## Cleanup

To remove test resources and the kind cluster:

```bash
kubectl delete -f plugins/kubeflow/test_files/spark/demo.yaml
kind delete cluster --name headlamp-kubeflow
```
