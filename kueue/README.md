# Kueue Plugin

A Headlamp plugin for visualizing and managing [Kueue](https://kueue.sigs.k8s.io/) resources in Kubernetes. Kueue is a cloud-native job queueing system that manages batch jobs and resource quotas.

This plugin adds a dedicated "Kueue" section to the Headlamp sidebar, allowing users to:
- Monitor ClusterQueues and LocalQueues.
- View details of Workloads and ResourceFlavors.
- Manage job priorities and admissions.

## Installation

### In-Cluster
If you are running Headlamp in-cluster, you can install this plugin by enabling it in the Helm chart configuration or by manually adding the plugin files to the plugins directory.

### Desktop / Docker Desktop
1. Open Headlamp.
2. Go to the **Plugin Catalog**.
3. Search for "Kueue".
4. Click **Install**.
5. Reload Headlamp to see the new "Kueue Batch" sidebar item.

## Development

1. Clone the repository and navigate to the `kueue` directory.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm start
   ```

## Features
- **Dashboard**: Overview of Kueue resources.
- **Queue Management**: Inspect queue status and pending workloads.
- **Resource Visualization**: See how resources are allocated across flavors.
