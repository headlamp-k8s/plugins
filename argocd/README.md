# Headlamp Argo CD Plugin

This is a Headlamp plugin created for the LFX Mentorship project to integrate Argo CD concepts directly into Headlamp Kubernetes workflows.

To learn more about Argo CD, see the [Argo CD Getting Started Guide](https://argo-cd.readthedocs.io/en/stable/getting_started/).

## Features

- **Managed Resource API Availability** — Compares each API reported in `Application.status.resources` with the APIs served by the selected local Kubernetes cluster. Missing kinds and unserved versions are highlighted without fetching arbitrary live objects.

- **Application List View** — Lists all Argo CD `Application` resources in the cluster with columns for project, source repo, target revision, sync status, and health status (rendered as color-coded badges).
- **Application Detail View** — Displays detailed metadata for a single Application: project, source, destination, sync status, health status, and Kubernetes events.
- **Sync Action** — Triggers a sync by patching the Application's `.operation` field via the Kubernetes API. The Argo CD application-controller picks this up exactly as it would from the Argo CD UI.
- **Refresh Action** — Requests a refresh by setting the `argocd.argoproj.io/refresh` annotation (supports `normal` and `hard` refresh types).
- **Rollback Action** — Lets an authorized user deliberately select a complete earlier deployment from Sync History and trigger it as a one-time Argo CD operation without changing the Application's configured Git revision.
- **Open in Argo CD** — Opens the current Application in the configured Argo CD web UI when `argocd-cm.data.url` is available.
- **ApplicationSet Inventory** — Adds read-only ApplicationSet list and detail pages with safe generator summaries, template information, controller conditions, and live generated Application status.
- **Headlamp Project GitOps Views** — Adds an Argo CD summary and Applications tab to Headlamp Projects for Applications that explicitly deploy into the Project's local namespaces.
- **Argo CD Sidebar Icon** — Registers the official Argo CD octopus logo as an offline Iconify icon (CSP-safe, no external fetch).

### API availability scope

The Managed Resources table checks whether the selected Kubernetes cluster serves the exact API group, version, and kind reported by Argo CD. For example, it can show that a resource uses an API version that the cluster no longer serves.

This is an **API availability check**, not a full controller compatibility test. A matching API does not prove that an installed controller implements every field or feature, and it does not prove that application traffic works. Remote or unverified Application destinations are not queried and are shown as `Not checked — remote`.

### Read-only ApplicationSet behavior

ApplicationSet pages intentionally have no create, edit, delete, sync, preview, or generator controls. Generated Applications are linked only when a live Application has an exact Kubernetes owner reference to the ApplicationSet UID in the same namespace and cluster. Names, labels, and naming conventions are not used as ownership evidence.

Generator summaries show only safe identifiers such as generator type, repository URL, path count, provider organization, or plugin ConfigMap name. Secret references, tokens, credentials, and arbitrary plugin inputs are not rendered.

The ApplicationSets sidebar entry is hidden when `applicationsets.argoproj.io` is not installed. Missing ApplicationSet support does not hide the existing Applications or Projects pages.

### Headlamp Project matching

An Argo CD Application appears in a Headlamp Project only when it was loaded from one of the Project's clusters, explicitly targets `in-cluster` or `https://kubernetes.default.svc`, and has an explicit destination namespace listed in the Project. Remote or unverified destinations and Applications without a destination namespace are excluded.

### Why the Kubernetes API instead of the Argo CD REST API?

Headlamp routes all plugin API calls through the Kubernetes apiserver service proxy. The apiserver consumes the `Authorization: Bearer` header for its own auth, so the Argo CD session token can never reach `argocd-server`. The browser also strips the `Cookie` header (a forbidden header in fetch). This makes the Argo CD REST API unreachable from a Headlamp plugin.

Instead, this plugin drives Argo CD the **Kubernetes-native way** — by writing directly to the `Application` custom resource. No Argo CD API token is needed; only standard Kubernetes RBAC permissions apply.

### Behavioral differences from the Argo CD UI

| Behavior                       | Argo CD UI                                                         | This plugin                                                                  |
| ------------------------------ | ------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| **Auth**                       | Argo CD session token (JWT or cookie)                              | Kubernetes RBAC (same kubeconfig as Headlamp)                                |
| **Sync**                       | REST API `POST /api/v1/applications/{name}/sync`                   | K8s PATCH on `.operation.sync` field                                         |
| **Rollback**                   | REST API rollback request                                          | K8s PATCH on `.operation.sync` using the selected historical source snapshot |
| **Refresh**                    | REST API `GET` with `?refresh=normal`                              | K8s PATCH setting `argocd.argoproj.io/refresh` annotation                    |
| **Refresh annotation cleanup** | Controller removes the annotation after reconciliation             | Same — the controller handles cleanup                                        |
| **`.operation` field cleanup** | Controller clears `.operation` and writes `.status.operationState` | Same — this is controller-managed                                            |

### Rollback behavior and safeguards

Rollback is available on an Application detail page only when all of these conditions are met:

- the user has Kubernetes `patch` permission for the Application;
- automated sync is disabled;
- Argo CD is not already processing another operation; and
- Sync History contains at least one earlier deployment with a complete source snapshot.

The dialog starts with no deployment selected. It shows the full historical revision, source, and
deployment time for review before confirmation. Single-source and multi-source Applications are
supported when Argo CD recorded complete, aligned history data.

After confirmation, Headlamp patches only the Application's top-level `.operation` field. It does
not patch `spec.source.targetRevision`, `spec.sources`, or the Git repository, and it does not enable
pruning. The success message says that rollback was **triggered** because the Argo CD controller
performs the deployment asynchronously. Sync windows and other controller policies can still reject
or delay the operation.

## Prerequisites

- Node.js (v20.11.1 or later)
- npm
- Headlamp running locally (desktop or in-cluster)
- A local Kubernetes cluster with Argo CD installed

## Required RBAC Permissions

The user's Kubernetes role must allow `patch` on `applications.argoproj.io` in the namespace where Argo CD Applications live (usually `argocd`). Example ClusterRole:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: argocd-headlamp-plugin
rules:
  - apiGroups: ['argoproj.io']
    resources: ['applications']
    verbs: ['get', 'list', 'watch', 'patch']
  - apiGroups: ['argoproj.io']
    resources: ['applicationsets']
    verbs: ['get', 'list', 'watch']
```

If the user lacks `patch` permission, the Sync, Refresh, and Rollback buttons are hidden. Rollback
requires no permission beyond the existing Application `patch` permission. If a patch request is
still attempted and returns 403, the plugin shows a clear error message explaining which Kubernetes
RBAC permission is missing.

### Optional Argo CD UI link permission

The **Open in Argo CD** action reads only the `url` key from the existing `argocd-cm`
ConfigMap. Grant this permission in the namespace where the Argo CD application controller
runs if you want the action to appear:

```yaml
- apiGroups: ['']
  resources: ['configmaps']
  resourceNames: ['argocd-cm']
  verbs: ['get']
```

The plugin first uses `Application.status.controllerNamespace` to find the ConfigMap and falls
back to the Application namespace for standard single-namespace installations. It never searches
other namespaces. The action is hidden when the ConfigMap is missing, access is denied, or `url`
is not a valid HTTP(S) URL.

Opening the link does not require an Argo CD API token and does not make an Argo CD API request.
Argo CD handles authentication in the new browser tab. Advanced diagnostics, diffs, and resource
actions remain available in the native Argo CD UI.

ApplicationSet and Headlamp Project views are read-only. They require only `get`, `list`, and `watch` access to ApplicationSets and Applications. If Application listing is unavailable, the ApplicationSet controller's generated count remains visible when reported, but live generated Application status and links are not shown.

## Development

Run `npm install` and then `npm run start` to begin development.

## Local Testing with Mock Data

If you don't have a full Argo CD installation, you can use the provided test manifests to create mock data in your cluster. This is useful for developing and testing the plugin UI without a full Argo CD deployment.

### Steps

1. **Create the Argo CD Application CRD** (this teaches Kubernetes about the Application resource type):

   ```bash
   kubectl apply -f test-files/deploy/crd.yaml
   ```

2. **Create the `argocd` namespace** (required for the sample Application):

   ```bash
   kubectl create namespace argocd
   ```

3. **Deploy the sample Application resource**:

   ```bash
   kubectl apply -f test-files/deploy/application.yaml
   ```

4. **Optionally configure the mock Argo CD UI link**:

   ```bash
   kubectl apply -f test-files/deploy/argocd-cm.yaml
   ```

   This manifest uses the reserved `.invalid` domain for safe UI testing. Do not apply it over a
   real Argo CD installation; configure the `url` key on that installation's existing
   `argocd-cm` instead.

5. **Build and install the plugin**:

   ```bash
   npm install
   npm run build
   ```

6. Copy the contents of the `dist/` folder to your Headlamp plugins directory:

   - **Linux/macOS**: `~/.config/Headlamp/plugins/argocd/`
   - **Windows**: `%APPDATA%\Headlamp\Config\plugins\argocd\`

7. **Launch Headlamp** and navigate to the **Argo CD > Applications** sidebar entry to see the mock `guestbook` application.

### Verifying the mock data

```bash
kubectl get applications -n argocd
```

You should see:

```
NAME        AGE
guestbook   Xs
```
