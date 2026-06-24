# Headlamp Argo CD Plugin

This is a Headlamp plugin created for the LFX Mentorship project to integrate Argo CD concepts directly into Headlamp Kubernetes workflows.

To learn more about Argo CD, see the [Argo CD Getting Started Guide](https://argo-cd.readthedocs.io/en/stable/getting_started/).

## Prerequisites

- Node.js (v20.11.1 or later)
- npm
- Headlamp running locally (desktop or in-cluster)
- A local Kubernetes cluster with Argo CD installed

## Goal

Extend the Projects view to include Argo CD context per project, showing associated Applications with:
- Sync Status
- Health Status
- Current Revision

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

4. **Build and install the plugin**:

   ```bash
   npm install
   npm run build
   ```

5. Copy the contents of the `dist/` folder to your Headlamp plugins directory:
   - **Linux/macOS**: `~/.config/Headlamp/plugins/argocd/`
   - **Windows**: `%APPDATA%\Headlamp\Config\plugins\argocd\`

6. **Launch Headlamp** and navigate to the **Argo CD > Applications** sidebar entry to see the mock `guestbook` application.

### Verifying the mock data

```bash
kubectl get applications -n argocd
```

You should see:

```
NAME        AGE
guestbook   Xs
```
