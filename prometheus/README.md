# Prometheus

This plugin adds advanced charts to the details view of workload resources.

It also shows optional Argo CD Application charts for sync activity, average sync duration, and
orphaned resources. These charts appear only when Prometheus is enabled for the selected cluster
and the resource is `argoproj.io/v1alpha1` `Application`. Missing Argo CD metrics simply show the
normal no-data state.

## Workload Revision Markers

On Deployment, StatefulSet, and DaemonSet metrics, retained revision objects are
automatically overlaid on CPU, memory, network, and filesystem charts.
Labels such as `r3` identify the revision number, and markers outside the selected
time range are not shown. Hover either a marker line or its label to see its
revision number, creation time, and timestamp caveat. Markers also support keyboard
focus. Workload or cluster changes load the new resource's history; other resources
are unchanged.

The timestamps are the creation times of owned ReplicaSets (Deployments) or
ControllerRevisions (StatefulSets and DaemonSets), not rollout start/completion
times. Kubernetes can garbage-collect older history, and rollbacks or restarts
that reuse an existing object do not create a separate event. This is not a
complete deployment audit log.

Revision reads use the selected workload's cluster and namespace and require
permission to list its revision resources. Missing permissions or malformed
history are shown separately from an empty retained history; metrics remain usable.

## Enabling Charts

For the charts to be shown, Prometheus must be installed in the cluster.

### Installing Prometheus from Headlamp

You can install Prometheus from Headlamp (desktop version only) by selecting the Apps
page from the sidebar, searching for "prometheus" and installing the app/chart from the "prometheus-community" repository.

## Tinkerbell Controller Health

For Tinkerbell controller metrics configuration and chart details, see the
[Tinkerbell plugin documentation](../tinkerbell/README.md#controller-health-metrics).
