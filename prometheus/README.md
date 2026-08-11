# Prometheus

This plugin adds advanced charts to the details view of workload resources.

## Enabling Charts

For the charts to be shown, Prometheus must be installed in the cluster.

### Installing Prometheus from Headlamp

You can install Prometheus from Headlamp (desktop version only) by selecting the Apps
page from the sidebar, searching for "prometheus" and installing the app/chart from the "prometheus-community" repository.

### Detecting Prometheus

The plugin auto-detects Prometheus by looking for pods or services labeled
`app.kubernetes.io/name=prometheus` (or `headlamp-prometheus=true`). A manual
address can also be set in the plugin settings, per cluster.

## Which views use the Kubernetes metrics API

The plugin's charts query Prometheus directly and work as soon as Prometheus is
detected. However, some Headlamp views read usage data from the Kubernetes
**metrics API** (`metrics.k8s.io`) instead of Prometheus:

- Cluster overview: CPU / Memory usage circles
- Node details: CPU / Memory usage
- Workloads -> Pods: the CPU / Memory columns

When the metrics API is not available, those views omit the data or show
"Install the metrics-server to get usage data." This message comes from
Headlamp itself (the views are not provided by this plugin).

### Avoiding the metrics-server

The metrics API is normally provided by `metrics-server`, but it can also be
served from Prometheus data using
[`prometheus-adapter`](https://github.com/kubernetes-sigs/prometheus-adapter) —
this is what OpenShift does. On a cluster that already runs Prometheus this
avoids installing metrics-server:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus-adapter prometheus-community/prometheus-adapter \
  --namespace prometheus-adapter --create-namespace \
  --set prometheus.url=http://prometheus-server.prometheus.svc \
  --set prometheus.port=80
```

> The `prometheus.port` must match the port of your Prometheus service (the
> official chart exposes port 80 and forwards to the server's 9090).

The adapter only serves the resource metrics API (`nodes`/`pods` usage) when
its `resourceRules` are configured. Enable them in the chart values, for
example:

```yaml
rules:
  resource:
    cpu:
      containerQuery: |
        sum by (<<.GroupBy>>) (
          rate(container_cpu_usage_seconds_total{container!="",<<.LabelMatchers>>}[3m])
        )
      nodeQuery: |
        sum by (<<.GroupBy>>) (
          rate(node_cpu_seconds_total{mode!="idle",mode!="iowait",mode!="steal",<<.LabelMatchers>>}[3m])
        )
      resources:
        overrides:
          namespace: { resource: "namespace" }
          pod: { resource: "pod" }
          node: { resource: "node" }
      containerLabel: container
    memory:
      containerQuery: |
        sum by (<<.GroupBy>>) (
          avg_over_time(container_memory_working_set_bytes{container!="",<<.LabelMatchers>>}[3m])
        )
      nodeQuery: |
        sum by (<<.GroupBy>>) (
          avg_over_time(node_memory_MemTotal_bytes{<<.LabelMatchers>>}[3m])
          -
          avg_over_time(node_memory_MemAvailable_bytes{<<.LabelMatchers>>}[3m])
        )
      resources:
        overrides:
          namespace: { resource: "namespace" }
          pod: { resource: "pod" }
          node: { resource: "node" }
      containerLabel: container
    window: 3m
```

After installing the adapter, `kubectl top nodes` (and the Headlamp views above)
should report usage data while metrics-server stays uninstalled.
