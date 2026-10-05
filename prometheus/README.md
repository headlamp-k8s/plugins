# Prometheus

This plugin adds advanced charts to the details view of workload resources.

It also shows optional Argo CD Application charts for sync activity, average sync duration, and
orphaned resources. These charts appear only when Prometheus is enabled for the selected cluster
and the resource is `argoproj.io/v1alpha1` `Application`. Missing Argo CD metrics simply show the
normal no-data state.

## Enabling Charts

For the charts to be shown, Prometheus must be installed in the cluster.

### Installing Prometheus from Headlamp

You can install Prometheus from Headlamp (desktop version only) by selecting the Apps
page from the sidebar, searching for "prometheus" and installing the app/chart from the "prometheus-community" repository.

## Tinkerbell Controller Health

For Tinkerbell controller metrics configuration and chart details, see the
[Tinkerbell plugin documentation](../tinkerbell/README.md#controller-health-metrics).
