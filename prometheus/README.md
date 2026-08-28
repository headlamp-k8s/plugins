# Prometheus

This plugin adds advanced charts to the details view of workload resources.

## Enabling Charts

For the charts to be shown, Prometheus must be installed in the cluster.

### Installing Prometheus from Headlamp

You can install Prometheus from Headlamp (desktop version only) by selecting the Apps
page from the sidebar, searching for "prometheus" and installing the app/chart from the "prometheus-community" repository.

## Tinkerbell Controller Health

With the Tinkerbell plugin installed, metrics are available on Workflow and BMC
Machine, Job, and Task detail pages. Enable metrics using the detail-page chart
button or the Prometheus plugin settings. The charts use the Kubernetes API
proxy and the current user's permissions; no separate browser connection to
Tinkerbell is needed.

These are **controller-wide** metrics, aggregated across replicas of the selected
installation, not measurements of the selected resource alone:

| Chart | Meaning |
| --- | --- |
| Reconciliations | All reconciliation attempts and reconciliation errors per second, over a five-minute window. Requeues are not counted as errors. |
| Duration | p50/p95 controller reconciliation time in seconds, not workflow execution time. |
| Queue | Reconciliation work items waiting to be processed. |
| Workers | Active controller workers and configured worker capacity, not provisioning agents. |

Hardware, Template, and WorkflowRuleSet do not expose matching controller metrics
in the verified Tinkerbell v0.23.0 setup and do not receive these charts.
Workflow success/failure remains available in the Tinkerbell resource views.

### Configure the Scrape Source

Configure Prometheus to scrape Tinkerbell's `/controllers/metrics` endpoint on its
HTTP service (port 7080 by default in v0.23.0). The combined `/metrics` endpoint
also includes these metrics; **scrape only one of them** to avoid double counting.

```yaml
scrape_configs:
  - job_name: tinkerbell
    scrape_interval: 15s
    metrics_path: /controllers/metrics
    static_configs:
      - targets: ['tinkerbell.tinkerbell.svc.cluster.local:7080']
```

Adjust the service address for your installation. For replicated installations,
configure discovery to scrape each controller pod once instead of a load-balanced
Service. The example targets the single-replica Vagrant lab.

In Prometheus plugin settings, select the Headlamp cluster and set **Tinkerbell
Scrape Job** to the exact resulting `job` label (default: `tinkerbell`). The job
must uniquely select that Tinkerbell installation, especially when Prometheus
collects metrics from several clusters or other controller-runtime applications.
Resource namespaces are intentionally not used as scrape namespaces. A different
job can be selected to inspect another installation.

Prometheus must be reachable through the Kubernetes service/pod proxy. Automatic
discovery needs permission to list candidate services/pods; a configured service
address needs access to that service's proxy. A permission or query error is not
treated as zero. Missing series and unobserved duration quantiles show no data;
rates require at least two scrapes. An idle controller can correctly report zero
activity and no duration observations.

### Try It in the Vagrant Lab

The optional [test manifest](test-files/tinkerbell/prometheus.yaml) deploys a small,
single-replica Prometheus in `tinkerbell-metrics-demo`, with 24-hour retention
and an ephemeral disk volume. It does not change
Hardware, Workflows, Templates, or BMC objects. This is not a production setup.

```sh
kubectl --context tinkerbell-vagrant apply -f test-files/tinkerbell/prometheus.yaml
kubectl --context tinkerbell-vagrant -n tinkerbell-metrics-demo rollout status deployment/prometheus
```

If automatic discovery is unavailable, use service address
`tinkerbell-metrics-demo/prometheus:9090` in the Prometheus settings. Check all four
resource types, chart variants, time ranges, pause/resume, and dark/light themes.
Use a nonexistent scrape job to verify the no-data state. Disable metrics and
switch clusters to verify visibility and data isolation. Kubernetes Jobs and
Cluster API Machines must retain their existing charts.

To remove only the demo monitoring installation:

```sh
kubectl --context tinkerbell-vagrant delete -f test-files/tinkerbell/prometheus.yaml
```

References: [Tinkerbell v0.23.0 metrics endpoints](https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/cmd/tinkerbell/http.go),
[Prometheus rate and histogram functions](https://prometheus.io/docs/prometheus/latest/querying/functions/).
