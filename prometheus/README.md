# Prometheus

This plugin adds advanced charts to the details view of workload resources.

It also shows optional Argo CD Application charts for sync activity, average sync duration, and
orphaned resources. These charts appear only when Prometheus is enabled for the selected cluster
and the resource is `argoproj.io/v1alpha1` `Application`. Missing Argo CD metrics simply show the
normal no-data state.

On PersistentVolumeClaim details, use the disk chart's **Timespan** and **Resolution**
selectors to override the cluster's defaults for the current view. These choices do not
change plugin settings and reset when switching clusters. **Pause** and **Resume**
control automatic refresh independently of the selected range and resolution.
Changing either selector starts a fresh chart session, so late responses from
the previous selection cannot replace the currently selected range's data.

## Workload Revision Markers

On Deployment, StatefulSet, and DaemonSet metrics, retained revision objects are
automatically overlaid on CPU, memory, network, and filesystem charts.
Labels such as `r3` identify the object's current revision number, and markers outside the selected
time range are not shown. Hover either a marker line or its label to see its
revision number, object name, creation time, and timestamp caveat. Object names link
to their detail pages when Headlamp has a registered route (normally ReplicaSets;
ControllerRevisions have no default detail page). Markers also support keyboard
focus and interactive tooltips. Overlapping markers share a label such as `r41 +1`,
with every revision listed in the popup. These interactive popups expose dialog
semantics, rather than a tooltip role containing links. With a marker focused,
use Up/Down, Page Up/Down, Home, or End to scroll its open preview without moving
focus or scrolling the page. Hovering never steals keyboard focus.
Click a marker or press Enter/Space
to open focus-managed details, Tab through its revision links, and use Escape or
Close to return focus to the marker without reopening the preview. The same
scrolling keys work from the details region, revision links, or Close button.
Shift+Tab/Tab stays within the modal; the preview remains non-modal.
Marker targets are at least 24px wide, with visible keyboard-focus outlines and
theme-contrasting labels. Paused charts retain the time range of
their displayed metrics. Workload or cluster changes load the new resource's history; other resources
are unchanged.

Grouping combines labels and details only: every revision retains a non-interactive
line at its own creation timestamp, so nearby rollouts remain aligned with metrics.

Polling does not restart an in-flight cycle: slow multi-query charts finish before
another automatic refresh starts. Each completed cycle updates its metrics and
time range together, keeping revision markers aligned with the displayed data.

The timestamps are the creation times of owned ReplicaSets (Deployments) or
ControllerRevisions (StatefulSets and DaemonSets), not rollout start/completion
times. Kubernetes can garbage-collect older history, and rollbacks or restarts
that reuse an existing object do not create a separate event. This is not a
complete deployment audit log.

When a Deployment's retained `deployment.kubernetes.io/revision-history` annotation
records prior revision numbers, its marker is labeled `r3 (reused)` and details
list its current number separately from retained previous numbers. The earliest
retained number is not assumed to be the original: Kubernetes may truncate this
annotation. No new marker is invented at rollback time.

For ControllerRevisions, or ReplicaSets without recorded history, a higher revision
number on an older-created object can suggest reuse. Such markers say
`r3 (possible reuse)`, not a confirmed rollback. Equal creation timestamps alone
do not trigger that inference. Missing/pruned history can prevent detection;
original revision numbers and reuse/rollback times remain unavailable.

Revision reads use the selected workload's cluster and namespace and require
permission to list its revision resources. Missing permissions or malformed
history are shown separately from an empty retained history; metrics remain usable.
Malformed revision errors identify the retained object's name when available.
Permission warnings stay concise; expand **Technical details** for the original
API error. Status-only workload updates do not relist history or retry permission
failures. Generation, controller acknowledgement, revision identity and selector
changes refresh history. Changes arriving during a pending read share one queued
follow-up read; changing workload or cluster still cancels immediately.
Use **Minimize revision marker warning** to replace the banner with one warning
icon in the chart actions. This choice is remembered per cluster across pages
and reloads. **Show revision marker warning** restores the banner and focuses its
technical-details control; it does not change metrics settings or permissions.

## Enabling Charts

For the charts to be shown, Prometheus must be installed in the cluster.

### Installing Prometheus from Headlamp

You can install Prometheus from Headlamp (desktop version only) by selecting the Apps
page from the sidebar, searching for "prometheus" and installing the app/chart from the "prometheus-community" repository.

## Tinkerbell Controller Health

For Tinkerbell controller metrics configuration and chart details, see the
[Tinkerbell plugin documentation](../tinkerbell/README.md#controller-health-metrics).
