
# Kubeflow Plugin for Headlamp

## Purpose
The Kubeflow plugin for Headlamp provides an operator-focused UI for managing and observing Kubeflow resources running in your Kubernetes clusters. It seamlessly detects available Kubeflow dependencies by natively checking the cluster APIs for Custom Resource Definitions (CRDs).

Instead of duplicating the Kubeflow Central Dashboard, this plugin augments it by providing deep, Kubernetes-centric observability. It helps operators inspect the underlying cluster health, pods, exact status conditions, and detailed configurations of complex Machine Learning workloads.

**Key Feature:** The plugin auto-detects installed features dynamically. You don't need the entire Kubeflow platform to use this plugin! If you install only Katib or only Notebooks via Helm/Kustomize, the plugin will recognize what is available and unlock precisely those specific UI sections in the Headlamp sidebar.

## Supported Components and CRDs
The plugin currently supports the following modular Kubeflow AI families:
* **Notebooks** (`kubeflow.org/v1`): `Notebook`, `Profile`, `PodDefault`
* **Pipelines** (`pipelines.kubeflow.org/v2beta1`): `Pipeline`, `PipelineVersion`
* **Katib / AutoML** (`kubeflow.org/v1beta1`): `Experiment`, `Trial`, `Suggestion`
* **Training Operators** (`trainer.kubeflow.org/v1alpha1`): `TrainJob`, `TrainingRuntime`, `ClusterTrainingRuntime`
* **Spark Operators** (`sparkoperator.k8s.io/v1beta2`): `SparkApplication`, `ScheduledSparkApplication`

## Installation of Kubeflow Components
Kubeflow is a very large platform, and it is common to install only the systems your team requires. Our plugin is fully compatible with modular installations. 

For full installation workflows across different environments, review the [upstream Kubeflow Manifests Repository](https://github.com/kubeflow/manifests). 

Below are examples of how operators can apply components piece-by-piece via `kustomize` (assuming you have cloned the upstream repo):

**Notebooks Support:**
```bash
kustomize build applications/jupyter/notebook-controller/upstream/crd/bases | kubectl apply -f -
kustomize build applications/jupyter/notebook-controller/upstream/overlays/kubeflow | kubectl apply -f -
```

**Katib (AutoML) Support:**
```bash
# From the root of the cloned kubeflow/manifests repository:
kustomize build applications/katib/upstream/installs/katib-with-kubeflow | kubectl apply -f -
```

**Training Operators:**
```bash
kustomize build applications/trainer/upstream/base | kubectl apply -f -
```

**Kubeflow Pipelines (Cloud-Native Mode):**
```bash
kustomize build applications/pipeline/upstream/env/cert-manager/platform-agnostic-multi-user-k8s-native | kubectl apply -f -
```

*Note: Headlamp will always dynamically scan and gracefully handle missing CRDs based on whichever installation method you choose, including experimental Helm charts.*

## Developer Testing (Lightweight Sandbox)
For UI plugin contributors, a full Kubeflow controller installation is not required and would drain considerable local CPU resources. A lightweight "CRD-only" setup using Headlamp's native probing design is highly recommended.

1. Create a lightweight `kind` cluster:
   ```bash
   kind create cluster --name headlamp-kubeflow
   kubectl config use-context kind-headlamp-kubeflow
   ```

2. Apply **only the CRDs** directly from upstream. This guarantees near-zero cluster CPU usage while completely activating all native UI tabs within the Headlamp plugin:

   **Notebooks & Multi-Tenancy:**
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubeflow/manifests/master/applications/jupyter/notebook-controller/upstream/crd/bases/kubeflow.org_notebooks.yaml
   kubectl apply -f https://raw.githubusercontent.com/kubeflow/manifests/master/applications/profiles/upstream/crd/bases/kubeflow.org_profiles.yaml
   kubectl apply -f https://raw.githubusercontent.com/kubeflow/manifests/master/applications/admission-webhook/upstream/base/crd.yaml
   ```

   **Katib:**
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubeflow/manifests/master/applications/katib/upstream/components/crd/experiment.yaml
   kubectl apply -f https://raw.githubusercontent.com/kubeflow/manifests/master/applications/katib/upstream/components/crd/trial.yaml
   kubectl apply -f https://raw.githubusercontent.com/kubeflow/manifests/master/applications/katib/upstream/components/crd/suggestion.yaml
   ```

   **Pipelines:**
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubeflow/manifests/master/applications/pipeline/upstream/base/crds/pipelines.kubeflow.org_pipelines.yaml
   kubectl apply -f https://raw.githubusercontent.com/kubeflow/manifests/master/applications/pipeline/upstream/base/crds/pipelines.kubeflow.org_pipelineversions.yaml
   ```

   **Training Operators:**
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubeflow/manifests/master/applications/trainer/upstream/base/crds/trainer.kubeflow.org_trainjobs.yaml
   kubectl apply -f https://raw.githubusercontent.com/kubeflow/manifests/master/applications/trainer/upstream/base/crds/trainer.kubeflow.org_trainingruntimes.yaml
   kubectl apply -f https://raw.githubusercontent.com/kubeflow/manifests/master/applications/trainer/upstream/base/crds/trainer.kubeflow.org_clustertrainingruntimes.yaml
   ```

## Running the Plugin Locally

To test modifications dynamically:

1. Start the Plugin Watcher under your `plugins/kubeflow` directory:
   ```bash
   npm install
   npm run start
   ```
   *Note: This will watch for changes and compile the plugin into your local Headlamp plugins folder (e.g., `~/.config/Headlamp/plugins/` on Linux).*

2. Launch Headlamp:
   - **Using the Desktop App:** Simply open your installed Headlamp application.
   - **From Source:** Clone the [Headlamp repository](https://github.com/headlamp-k8s/headlamp) in a separate directory and start the application following its developer guide (e.g., `make run-backend` and `npm start` in the `frontend` folder).

As long as the plugin watcher is running, any changes saved in the `src/` directory will automatically hot-reload inside Headlamp!
