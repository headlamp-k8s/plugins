# Grafana

The [Grafana Headlamp Plugin](https://github.com/headlamp-k8s/plugins/tree/main/grafana) extends Headlamp so that it has support for deep-linking directly into Grafana dashboards.

[Grafana](https://grafana.com/) is a multi-platform open source analytics and interactive visualization web application. It provides charts, graphs, and alerts for the web when connected to supported data sources.

Use the Grafana plugin to seamlessly jump from a Kubernetes resource view in Headlamp straight to its corresponding metrics in Grafana!

This is a beta release. Please leave any feedback as a [GitHub issue](https://github.com/headlamp-k8s/plugins/issues/new), or drop by the `#headlamp` channel on the Kubernetes Slack.

## Setup

1. Open Headlamp and navigate to your **Account Settings**.
2. Click on the **Grafana** tab and select your active cluster.
3. Enter the Base URL of your Grafana instance (e.g., `http://localhost:3000`).

## Usage

To link a Kubernetes resource to a Grafana dashboard, add the `grafana.com/dashboard` annotation to the resource's manifest. The value should be the relative path to the dashboard.

Example:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  annotations:
    grafana.com/dashboard: '/d/myapp-dashboard?var-namespace=default'
```

When viewing this resource in Headlamp, the Grafana icon will appear in the top-right header action bar. Clicking it will automatically drop you into the specific dashboard!
