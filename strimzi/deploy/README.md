# Deployment Guide

This directory contains Kubernetes manifests for deploying Headlamp with the Strimzi plugin.

## Prerequisites

1. **Kubernetes cluster** running (Docker Desktop, Minikube, kind, etc.)
2. **kubectl** configured to access your cluster
3. **Strimzi operator** installed in your cluster
4. **Built plugin** - Run `npm run build` in the project root to generate the plugin files

## Deployment Options

### Option 1: Full Permissions (Development/Testing)

File: `headlamp.yaml`
- Uses `cluster-admin` role
- Grants full access to all cluster resources
- **Recommended for**: Development and testing environments

### Option 2: Minimal Permissions (Production)

File: `headlamp-minimal.yaml`
- Uses minimal RBAC permissions
- Only grants access to Strimzi resources and Secrets
- **Recommended for**: Production environments

## Installation Steps

### 1. Update the Plugin Path

Before applying the manifests, you **must** update the `hostPath` volume path to point to your local plugin directory.

Edit either `headlamp.yaml` or `headlamp-minimal.yaml` and find this section:

```yaml
volumes:
  - name: plugins
    hostPath:
      path: /Users/angelo/Downloads/github/strimzi-headlamp/plugins  # UPDATE THIS PATH
      type: Directory
```

Replace with your actual path to the `plugins` directory. For example:
- macOS: `/Users/yourname/path/to/strimzi-headlamp/plugins`
- Linux: `/home/yourname/path/to/strimzi-headlamp/plugins`

**Note**: Docker Desktop on macOS with older versions may require the `/run/desktop/mnt/host` prefix.

### 2. Build the Plugin

```bash
npm run build
```

This creates the built plugin in the `plugins/` directory.

### 3. Deploy to Kubernetes

**For development/testing (full permissions):**
```bash
kubectl apply -f deploy/headlamp.yaml
```

**For production (minimal permissions):**
```bash
kubectl apply -f deploy/headlamp-minimal.yaml
```

### 4. Access Headlamp

The service is exposed via NodePort on port 30080:

```bash
# Get the access URL
kubectl get svc -n headlamp

# Access Headlamp
# Docker Desktop / Minikube: http://localhost:30080
# Other environments: http://<node-ip>:30080
```

For Minikube, you may need to use:
```bash
minikube service headlamp -n headlamp
```

## Verify Installation

Check that Headlamp is running:

```bash
kubectl get pods -n headlamp
kubectl logs -n headlamp -l app=headlamp
```

## Uninstall

```bash
# Remove the deployment
kubectl delete -f deploy/headlamp.yaml
# or
kubectl delete -f deploy/headlamp-minimal.yaml

# Optionally, delete the namespace
kubectl delete namespace headlamp
```

## Troubleshooting

### Plugin Not Loading

1. Verify the hostPath points to the correct directory
2. Check that the `plugins/` directory contains the built plugin files
3. Check Headlamp logs: `kubectl logs -n headlamp -l app=headlamp`

### Permission Issues

If using `headlamp-minimal.yaml` and encountering permission errors:
- Verify Strimzi CRDs are installed
- Check RBAC permissions: `kubectl describe clusterrole headlamp-strimzi-plugin`
- Consider using `headlamp.yaml` for development

### Pod Not Starting

Check pod events:
```bash
kubectl describe pod -n headlamp -l app=headlamp
```

Common issues:
- Invalid hostPath
- Image pull errors
- Resource constraints
