# Kubeflow Notebooks Plugin — Operator & SRE Guide

A Headlamp plugin that gives **platform operators, SREs, and ML engineers** deep Kubernetes-native observability over Kubeflow Notebook Servers, Profiles, and PodDefaults without switching between `kubectl` and multiple dashboards.

---

## What It Gives You

This plugin surfaces the Kubernetes reality behind Kubeflow — real pod conditions, actual container states, and exact failure reasons — in a way the Kubeflow Central Dashboard never shows. Instead of a broad "Ready / Not Ready" badge, you get the specific reason a notebook is stuck: `ImagePullBackOff`, `CrashLoopBackOff`, `OOMKilled`, or an unschedulable pod waiting for GPU capacity. You can inspect the full resource footprint of every notebook across all namespaces in one view, understand what a `PodDefault` actually injects (including secret and configmap references), and see how quota is distributed across tenant profiles — all without touching `kubectl`.

## What It Offers

### Notebooks Dashboard (`/kubeflow/notebooks`)

A high-level overview page with:

- **Summary Cards** — Total notebook servers, profiles, PodDefaults, and aggregate CPU/memory/GPU requests across all namespaces
- **All Notebook Servers Table** — Name, namespace, type (auto-detected), image, and real-time status
- **Namespace Distribution** — How many notebooks are deployed per namespace
- **Images In Use** — Which container images are deployed and how many notebooks use each

### Notebook Servers List & Detail (`/kubeflow/notebooks/servers`)

**List View:**

- Type auto-detection from container image (Jupyter / VS Code / RStudio / Custom)
- Resource requests with GPU badges
- Volume counts with PVC breakdown
- Status badges derived from real Kubernetes conditions

**Detail View:**

- Full resource requirements (requests vs limits vs GPU)
- Volume & mount mappings (PVC / EmptyDir / ConfigMap / Secret)
- Environment variables (including secret/configmap references)
- Status conditions with reason and message
- Sidecar containers and tolerations

### Profiles List & Detail (`/kubeflow/notebooks/profiles`)

- Owner identity (User/Group) with visual indicators
- Resource quota breakdown: CPU, memory, GPU limits
- Profile plugins (WorkloadIdentity, etc.) with raw spec inspection
- Status conditions showing provisioning state

### PodDefaults List & Detail (`/kubeflow/notebooks/poddefaults`)

- Selector label matching rules
- **Injected environment variables** — Shows secret/configmap references, not just plain values
- **Injected volumes** — Type-aware display (Secret, ConfigMap, EmptyDir, PVC)
- **Injected volume mounts** — Mount paths with read-only flags
- **Injected annotations** — Key/value pairs added to matched pods
- **Service account overrides** — When the PodDefault replaces the pod's SA

## Data Integrity

All data flows through:

```
Headlamp Backend → Kubernetes API Server → CRD API Groups
  /apis/kubeflow.org/v1/notebooks
  /apis/kubeflow.org/v1/profiles
  /apis/kubeflow.org/v1alpha1/poddefaults
```

The `SectionPage` wrapper performs API group discovery for the wrapped notebook/profile/poddefault sections. When a required API group is unavailable, those sections show a helpful message instead of rendering against missing CRDs.

---

## Developer Testing Guide

### Prerequisites

- [kind](https://kind.sigs.k8s.io/) or [minikube](https://minikube.sigs.k8s.io/)
- `kubectl` configured
- Node.js 18+
- Go 1.22+ (for Headlamp backend, or use the desktop app)

### Step 1: Create a Local Cluster

```bash
kind create cluster --name headlamp-kubeflow
kubectl config use-context kind-headlamp-kubeflow
```

### Step 2: Install CRDs

Apply **only the CRDs** (no controllers needed for UI development):

```bash
# Notebooks CRD
kubectl apply -f https://raw.githubusercontent.com/kubeflow/manifests/master/applications/jupyter/notebook-controller/upstream/crd/bases/kubeflow.org_notebooks.yaml

# Profiles CRD
kubectl apply -f https://raw.githubusercontent.com/kubeflow/manifests/master/applications/profiles/upstream/crd/bases/kubeflow.org_profiles.yaml

# PodDefaults CRD
kubectl apply -f https://raw.githubusercontent.com/kubeflow/manifests/master/applications/admission-webhook/upstream/base/crd.yaml
```

### Step 3: Create Test Data

Create a namespace and apply sample resources:

```bash
kubectl create namespace kubeflow-user
```

**Sample Profile:**

```bash
cat <<EOF | kubectl apply -f -
apiVersion: kubeflow.org/v1
kind: Profile
metadata:
  name: kubeflow-user
spec:
  owner:
    kind: User
    name: user@example.com
  resourceQuotaSpec:
    hard:
      cpu: "4"
      memory: 8Gi
      requests.nvidia.com/gpu: "1"
EOF
```

**Sample Notebook Server:**

```bash
cat <<EOF | kubectl apply -f -
apiVersion: kubeflow.org/v1
kind: Notebook
metadata:
  name: jupyter-notebook-scipy
  namespace: kubeflow-user
  labels:
    app: jupyter
    notebook-name: jupyter-notebook-scipy
spec:
  template:
    spec:
      containers:
      - name: jupyter-notebook-scipy
        image: kubeflownotebookswg/jupyter-scipy:v1.9.0
        ports:
        - name: notebook-port
          containerPort: 8888
          protocol: TCP
        resources:
          requests:
            cpu: "0.5"
            memory: 1Gi
          limits:
            cpu: "1"
            memory: 2Gi
        volumeMounts:
        - name: workspace
          mountPath: /home/jovyan
      volumes:
      - name: workspace
        emptyDir: {}
EOF
```

**Sample PodDefault:**

```bash
cat <<EOF | kubectl apply -f -
apiVersion: kubeflow.org/v1alpha1
kind: PodDefault
metadata:
  name: add-gcp-secret
  namespace: kubeflow-user
spec:
  desc: "Add GCP service account credentials"
  selector:
    matchLabels:
      gcp-creds: "true"
  env:
  - name: GOOGLE_APPLICATION_CREDENTIALS
    value: /secret/gcp/key.json
  volumes:
  - name: gcp-secret
    secret:
      secretName: gcp-sa-key
  volumeMounts:
  - name: gcp-secret
    mountPath: /secret/gcp
EOF
```

> **Note:** The CRDs are enough for the Headlamp UI to discover and display Notebook objects. Without the notebook-controller, the Notebook usually stays in `Pending` because nothing is reconciling the spec into a running pod, which is expected for UI development. If you want a real `Running` notebook, install the controller:
>
> ```bash
> kustomize build https://github.com/kubeflow/manifests/apps/jupyter/notebook-controller/upstream/overlays/kubeflow | kubectl apply -f -
> ```

### Step 4: Run the Plugin

```bash
cd plugins/kubeflow
npm install
npm run start     # Watches for changes, auto-deploys to ~/.config/Headlamp/plugins/
```

### Step 5: Run Headlamp

**Option A — From source (recommended for development):**

```bash
# In the headlamp repo root:
make run-backend   # Starts backend on localhost:4466
make run-frontend  # Starts frontend on localhost:3000
```

**Option B — Desktop app:**
Open the installed Headlamp application. Plugin auto-loads from `~/.config/Headlamp/plugins/`.

### Step 6: Verify

1. Open `http://localhost:3000`
2. Select the `headlamp-kubeflow` cluster
3. Click **Kubeflow** in the sidebar
4. Navigate to **Notebooks** → verify the dashboard shows your test data
5. Click into **Notebook Servers**, **Profiles**, **PodDefaults** to verify detail views

### Verify Specific Scenarios

| Scenario                    | How to test                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| Running notebook            | Install the notebook-controller (Step 3 note), wait for pod to be Ready                           |
| Failed notebook             | Apply a notebook with a non-existent image (e.g., `image: bad/image:fake`)                        |
| PodDefault with secret refs | Apply PodDefault with `secretKeyRef` env vars (see sample above)                                  |
| Empty state                 | Delete all notebooks/profiles/poddefaults, verify "no data" messages                              |
| Missing CRDs                | Delete a CRD (`kubectl delete crd notebooks.kubeflow.org`), verify the "CRD not detected" message |

---

## Running Tests

### Unit Tests

```bash
cd plugins/kubeflow
npm test
```

Tests cover the pure utility functions in `notebookUtils.ts`:

- `getNotebookStatus` — All 10+ status derivation branches (Running, Failed, ImagePullBackOff, OOMKilled, Pending, etc.)
- `getNotebookType` — Image pattern matching (Jupyter, VS Code, RStudio, Custom)
- `getProfileStatus` — Profile condition handling (Active, Ready, Not Ready)

### Storybook

```bash
cd plugins/kubeflow
npm run storybook
```

Storybook stories use dedicated story components with realistic mock data (modeled from actual `kubectl get -o json` output). Available stories:

- `Kubeflow/Overview` — Control Center with all modules
- `Kubeflow/Notebooks/Overview` — Notebooks dashboard
- `Kubeflow/Notebooks/NotebookDetail` — Running/Pending/Failed/Terminated notebooks
- `Kubeflow/Notebooks/StatusBadge` — All status and type badges
- `Kubeflow/Notebooks/PodDefaultDetail` — AWS creds, GCP creds, empty
- `Kubeflow/Notebooks/ProfileDetail` — Ready, Not Ready, Active profiles

### Build

```bash
cd plugins/kubeflow
npm run build     # Production bundle
npx tsc --noEmit  # Type-check only
```

---

## Cleanup

To remove test resources and the kind cluster:

```bash
kubectl delete notebook jupyter-notebook-scipy -n kubeflow-user
kubectl delete profile kubeflow-user
kubectl delete poddefault add-gcp-secret -n kubeflow-user
kubectl delete namespace kubeflow-user
kind delete cluster --name headlamp-kubeflow
```
