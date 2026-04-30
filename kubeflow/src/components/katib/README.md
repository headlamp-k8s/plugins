# Kubeflow Katib Plugin - Operator & SRE Guide

A Headlamp plugin module that gives platform operators, SREs, and ML engineers Kubernetes-native visibility into Kubeflow Katib resources without switching between multiple dashboards and `kubectl`.

---

## What It Gives You

This Katib module surfaces the Kubernetes-side truth for hyperparameter tuning workflows:

- Which Experiments are active, failed, or converged
- Which Trials are running and what metric values they reported
- Which Suggestions were requested vs assigned
- Which service accounts and RBAC relationships are involved
- How far each experiment has progressed against trial budgets

The UI keeps kubectl-style core fields in list views while adding richer operational context in detail views.

## What It Offers

### Katib Overview (`/kubeflow/katib`)

- Summary cards for total Experiments, Trials, and Suggestions
- Experiment Health section with quick status triage
- Progress & Best Trials section tracking optimization success
- Service Accounts & Worker Types section exposing RBAC issues
- Cross-links into Experiment and Trial detail pages

### Katib Experiments (`/kubeflow/katib/experiments`)

#### List View

- Name and namespace
- Algorithm
- Objective (type + metric)
- Trial counts (current/max)
- Parallel and failed counts
- Early stopping status
- Condition-derived status and age

#### Detail View

- Core objective and algorithm metadata
- Progress and cost snapshot
- Related Trials table
- Best Trial So Far
- Current optimal metrics and parameter assignments
- Search space table
- Trial template and worker information
- Early stopping section
- RBAC section
- Action button for raw JSON view
- Kubernetes events

### Katib Trials (`/kubeflow/katib/trials`)

#### List View

- Name, namespace, owning Experiment
- Condition-derived status
- Metric result
- Start/end time
- Failure reason
- Age
- Row action: View Worker Logs

#### Detail View

- Experiment linkage and objective metadata
- Metric result and timing
- Conditions table
- Observed metrics section
- Raw spec preview
- Detail action: View Worker Logs
- Kubernetes events

### Katib Suggestions (`/kubeflow/katib/suggestions`)

#### List View

- Name and namespace
- Suggestion algorithm
- Requested suggestions
- Assigned suggestions
- Condition-derived status
- Age

#### Detail View

- Algorithm and request/assignment summary
- Conditions table
- Raw spec preview
- Kubernetes events

---

## Routes and Navigation

Sidebar and route names follow the `kubeflow-katib-*` convention:

- `kubeflow-katib-overview`
- `kubeflow-katib-experiments-list`
- `kubeflow-katib-experiments-detail`
- `kubeflow-katib-trials-list`
- `kubeflow-katib-trials-detail`
- `kubeflow-katib-suggestions-list`
- `kubeflow-katib-suggestions-detail`

---

## Data Integrity

All Katib data is fetched through the Kubernetes API server from Katib CRDs:

```text
Headlamp Backend -> Kubernetes API Server -> kubeflow.org/v1beta1
  /apis/kubeflow.org/v1beta1/experiments
  /apis/kubeflow.org/v1beta1/trials
  /apis/kubeflow.org/v1beta1/suggestions
```

`SectionPage` performs API-path discovery checks and renders actionable fallback messaging when CRDs are missing or inaccessible.

---

## Developer Testing Guide

### Prerequisites

- kind or minikube
- kubectl configured
- Node.js 18+

### Step 1: Create a Local Cluster

```bash
kind create cluster --name headlamp-kubeflow
kubectl config use-context kind-headlamp-kubeflow
```

### Step 2: Install Katib CRDs

```bash
kubectl apply -f https://raw.githubusercontent.com/kubeflow/manifests/master/apps/katib/upstream/components/crd/installs/katib.kubeflow.org_experiments.yaml
kubectl apply -f https://raw.githubusercontent.com/kubeflow/manifests/master/apps/katib/upstream/components/crd/installs/katib.kubeflow.org_trials.yaml
kubectl apply -f https://raw.githubusercontent.com/kubeflow/manifests/master/apps/katib/upstream/components/crd/installs/katib.kubeflow.org_suggestions.yaml
```

### Step 3: Create Sample Katib Data

```bash
kubectl create namespace kubeflow-user
```

Apply an Experiment (the controller is optional for UI development):

```bash
kubectl apply -f test_files/katib/experiment.yaml
```

To test error handling, apply a failed experiment:

```bash
kubectl apply -f test_files/katib/experiment-failed.yaml
```

If you want real Trial/Suggestion reconciliation and runtime statuses, install Katib controllers from Kubeflow manifests.

### Step 4: Run the Plugin

```bash
cd plugins/kubeflow
npm install
npm run start
```

### Step 5: Verify in Headlamp

1. Open Headlamp and select your cluster.
2. Navigate to `Kubeflow -> Katib`.
3. Validate Overview cards and recent resource tables.
4. Validate Experiments, Trials, and Suggestions list/detail pages.
5. Validate log action on Trial rows/detail.

---

## Running Tests

### Unit Tests

```bash
cd plugins/kubeflow
npm test
```

Current Katib utility tests cover:

- Katib condition-to-status mapping
- Feasible-space formatting
- Related trial matching
- Best-trial selection
- Terminal trial counting

### Type Check

```bash
cd plugins/kubeflow
npm run tsc
```

### Storybook

```bash
cd plugins/kubeflow
npm run storybook
```

Katib stories include:

- `KatibOverview`
- `KatibExperimentsList`
- `KatibExperimentsDetail`
- `KatibTrialsList`
- `KatibTrialsDetail`
- `KatibSuggestionsList`
- `KatibSuggestionsDetail`

---

## Cleanup

```bash
kubectl delete namespace kubeflow-user
kind delete cluster --name headlamp-kubeflow
```
