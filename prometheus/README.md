# Prometheus

This plugin adds advanced charts to the details view of workload resources.

It also shows optional Argo CD Application charts for sync activity, average sync duration, and
orphaned resources. These charts appear only when Prometheus is enabled for the selected cluster
and the resource is `argoproj.io/v1alpha1` `Application`. Missing Argo CD metrics simply show the
normal no-data state.

## KServe InferenceService Charts

KServe `serving.kserve.io` `InferenceService` resources show request rate, p50/p95/p99 latency,
and CPU and memory usage for the predictor pods. Pods are matched by name
(`<name>-predictor-...`), so both raw and Knative (serverless) deployment modes are covered.

- Request rate and latency use the `request_predict_seconds` histogram exported by KServe's
  Python model servers (for example the sklearn, xgboost, lightgbm and custom Python runtimes).
  Other runtimes such as vLLM, Triton and TorchServe export different metric names, so those two
  charts show the normal no-data state for them. CPU and memory charts work for any runtime.
- Prometheus must scrape the model server. KServe predictor containers do not declare container
  ports, so a `PodMonitor` needs a relabelling rule that sets the target address to
  `<podIP>:8080`, the model server's default HTTP port, which also serves `/metrics`.

## Enabling Charts

For the charts to be shown, Prometheus must be installed in the cluster.

### Installing Prometheus from Headlamp

You can install Prometheus from Headlamp (desktop version only) by selecting the Apps
page from the sidebar, searching for "prometheus" and installing the app/chart from the "prometheus-community" repository.

## Tinkerbell Controller Health

For Tinkerbell controller metrics configuration and chart details, see the
[Tinkerbell plugin documentation](../tinkerbell/README.md#controller-health-metrics).
