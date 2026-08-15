# Headlamp Argo CD Plugin

This is a Headlamp plugin created for the LFX Mentorship project to integrate Argo CD concepts directly into Headlamp Kubernetes workflows.

To learn more about Argo CD, see the [Argo CD Getting Started Guide](https://argo-cd.readthedocs.io/en/stable/getting_started/).

## Features

- **Application List View** — Lists all Argo CD `Application` resources in the cluster with columns for project, source repo, target revision, sync status, and health status (rendered as color-coded badges).
- **Application Detail View** — Displays detailed metadata for a single Application: project, source, destination, sync status, health status, and Kubernetes events.
- **Sync Action** — Triggers a sync by patching the Application's `.operation` field via the Kubernetes API. The Argo CD application-controller picks this up exactly as it would from the Argo CD UI.
- **Refresh Action** — Requests a refresh by setting the `argocd.argoproj.io/refresh` annotation (supports `normal` and `hard` refresh types).
- **Open in Argo CD** — Opens the current Application in the configured Argo CD web UI when `argocd-cm.data.url` is available.
- **Argo CD Sidebar Icon** — Registers the official Argo CD octopus logo as an offline Iconify icon (CSP-safe, no external fetch).

### Why the Kubernetes API instead of the Argo CD REST API?

Headlamp routes all plugin API calls through the Kubernetes apiserver service proxy. The apiserver consumes the `Authorization: Bearer` header for its own auth, so the Argo CD session token can never reach `argocd-server`. The browser also strips the `Cookie` header (a forbidden header in fetch). This makes the Argo CD REST API unreachable from a Headlamp plugin.

Instead, this plugin drives Argo CD the **Kubernetes-native way** — by writing directly to the `Application` custom resource. No Argo CD API token is needed; only standard Kubernetes RBAC permissions apply.

### Behavioral differences from the Argo CD UI

| Behavior | Argo CD UI | This plugin |
|---|---|---|
| **Auth** | Argo CD session token (JWT or cookie) | Kubernetes RBAC (same kubeconfig as Headlamp) |
| **Sync** | REST API `POST /api/v1/applications/{name}/sync` | K8s PATCH on `.operation.sync` field |
| **Refresh** | REST API `GET` with `?refresh=normal` | K8s PATCH setting `argocd.argoproj.io/refresh` annotation |
| **Refresh annotation cleanup** | Controller removes the annotation after reconciliation | Same — the controller handles cleanup |
| **`.operation` field cleanup** | Controller clears `.operation` and writes `.status.operationState` | Same — this is controller-managed |

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
  - apiGroups: ["argoproj.io"]
    resources: ["applications"]
    verbs: ["get", "list", "watch", "patch"]
```

If the user lacks `patch` permission, the Sync/Refresh buttons are hidden. If a patch request is still attempted and returns 403, the plugin shows a clear error message explaining which RBAC permission is missing.

### Optional Argo CD UI link permission

The **Open in Argo CD** action reads only the `url` key from the existing `argocd-cm`
ConfigMap. Grant this permission in the namespace where the Argo CD application controller
runs if you want the action to appear:

```yaml
- apiGroups: [""]
  resources: ["configmaps"]
  resourceNames: ["argocd-cm"]
  verbs: ["get"]
```

The plugin first uses `Application.status.controllerNamespace` to find the ConfigMap and falls
back to the Application namespace for standard single-namespace installations. It never searches
other namespaces. The action is hidden when the ConfigMap is missing, access is denied, or `url`
is not a valid HTTP(S) URL.

Opening the link does not require an Argo CD API token and does not make an Argo CD API request.
Argo CD handles authentication in the new browser tab. Advanced diagnostics, diffs, and resource
actions remain available in the native Argo CD UI.

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
