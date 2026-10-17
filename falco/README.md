# Falco Headlamp Plugin

A modern, Headlamp plugin for visualizing and managing [Falco](https://falco.org/) security events and rules in Kubernetes clusters.

## Features

- **Falco Events Viewer:**

  - Real-time streaming and display of Falco security events from all cluster namespaces.
  - Powerful search and filter UI for namespaces, pods, containers, and severity.
  - Multiple backend options: file-based (default) or Redis for persistent storage.
  - Fully type-safe event handling and clear, maintainable utility functions.

- **Falco Rules Explorer:**

  - Lists all Falco rules loaded in the cluster, with support for multiple pods and custom rule files.
  - Search and filter by rule name, description, pod, or source file.

- **Storage Backends:**

  - **File-based** (default): Access events directly from Falco output files.
  - **Redis**: Store events in Redis for persistence and centralized access via a Redis REST proxy.

## Prerequisites

Before you begin, ensure you have the following:

- A running Kubernetes cluster (minikube, kind, or a production cluster)
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) installed and configured
- [Helm](https://helm.sh/docs/intro/install/) v3+ installed
- [Node.js](https://nodejs.org/) and npm installed (for development)
- [Headlamp](https://headlamp.dev/docs/latest/installation/) installed and access to your cluster

## Setup

### Basic Setup

1. Clone this repository and install dependencies:

   ```bash
   npm install
   ```

2. Install Falco with file output enabled:

   ```bash
   helm install falco falcosecurity/falco \
     --namespace falco \
     --set falco.file_output.enabled=true \
     --set falco.file_output.filename="/tmp/falco_events.json" \
     --set falco.file_output.keep_alive=true \
     --set falco.json_output=true \
     --set driver.kind=modern_ebpf \
     --set falco.tty=true
   ```

### Redis Backend Setup

To use the Redis backend for persistent event storage:

1. Deploy Redis and the REST proxy in your Kubernetes cluster:

   ```bash
   npm run setup-redis
   ```

   > **Important Note:** If you already have a Redis server but not the REST proxy, you must still deploy the Redis REST proxy component. This plugin communicates with Redis via HTTP and requires the proxy layer.
   >
   > **For Production Environments**: To connect to your existing Redis server, modify `redis/redis-rest-proxy.yaml` by changing line 46 in the Python code:
   >
   > ```python
   > # Change this line:
   > rclient = redis.Redis(host='redis-service', port=6379)
   >
   > # To point to your Redis server:
   > rclient = redis.Redis(host='your-redis-hostname', port=6379, password='your-password-if-needed')
   > ```
   >
   > You may also need to adjust security settings, resource limits, and consider adding persistence for production deployments.

2. Install Falco with both file and Redis output enabled using our provided values file:

   ```bash
   # The falco-values.yaml file in the repo already contains the Redis configuration
   helm install falco falcosecurity/falco \
     --namespace falco \
     --set falco.file_output.enabled=true \
     --set falco.file_output.filename="/tmp/falco_events.json" \
     --set falco.file_output.keep_alive=true \
     --set falco.json_output=true \
     --set driver.kind=modern_ebpf \
     --values=falco-values.yaml \
     --set falco.tty=true
   ```

3. In the plugin settings, switch to Redis backend and test the connection.

## Development

To develop or extend this plugin:

1. Clone this repository and install dependencies (see `package.json`).
2. Run Headlamp in plugin development mode.
3. Edit TypeScript/TSX files in `src/` for UI or logic changes.
4. All contributions must maintain or improve type safety and documentation.

See the following resources for Headlamp plugin development:

- [Headlamp Plugin Getting Started](https://headlamp.dev/docs/latest/development/plugins/)
- [Headlamp API Reference](https://headlamp.dev/docs/latest/development/api/)
- [UI Component Storybook](https://headlamp.dev/docs/latest/development/frontend/#storybook)
- [Plugin Examples](https://github.com/headlamp-k8s/headlamp/tree/main/plugins/examples)

## Contributing

Contributions are welcome! Please ensure that:

- All new code is type-safe and well-documented.
- Comments describing utility functions are replaced with TypeScript type annotations and JSDoc comments.
- No business logic or user experience is broken by refactors.
