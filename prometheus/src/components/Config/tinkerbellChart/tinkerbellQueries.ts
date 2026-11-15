/** Controllers exporting metrics in Tinkerbell v0.23.0. */
export type TinkerbellController = 'workflow' | 'machine' | 'job' | 'task';

/** Resource identity, supporting both API objects and Headlamp resource instances. */
interface ResourceIdentity {
  /** Kubernetes resource kind. */
  kind?: string;
  /** Kubernetes API group and version. */
  apiVersion?: string;
  /** Original API identity, preferred over the wrapper's identity. */
  jsonData?: {
    /** Original resource kind. */
    kind?: string;
    /** Original API group and version. */
    apiVersion?: string;
  };
}

/**
 * Selects a controller only for the supported Tinkerbell API identities.
 * @param resource - Kubernetes object or Headlamp resource instance.
 * @returns Controller name, or undefined for unrelated or unsupported resources.
 * @see https://github.com/tinkerbell/tinkerbell/tree/v0.23.0/api
 */
export function getTinkerbellController(
  resource?: ResourceIdentity
): TinkerbellController | undefined {
  const kind = resource?.jsonData?.kind ?? resource?.kind;
  const apiVersion = resource?.jsonData?.apiVersion ?? resource?.apiVersion;
  if (apiVersion === 'tinkerbell.org/v1alpha1' && kind === 'Workflow') {
    return 'workflow';
  }
  if (apiVersion === 'bmc.tinkerbell.org/v1alpha1') {
    switch (kind) {
      case 'Machine':
        return 'machine';
      case 'Job':
        return 'job';
      case 'Task':
        return 'task';
    }
  }
  return undefined;
}

/**
 * Builds controller-wide queries scoped to one installation's scrape job.
 * Rates use five minutes of samples and aggregate replicas before display.
 * @param controller - Controller exporting the metrics, not a resource name.
 * @param job - Exact Prometheus job label uniquely identifying the installation.
 * @returns Queries for rates, duration quantiles, queue depth, and worker counts.
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/cmd/tinkerbell/http.go
 * @see https://prometheus.io/docs/prometheus/latest/querying/functions/#histogram_quantile
 */
export function getTinkerbellQueries(controller: TinkerbellController, job: string) {
  const escapedJob = job.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  const labels = `job="${escapedJob}",controller="${controller}"`;
  const buckets = `sum by (le) (rate(controller_runtime_reconcile_time_seconds_bucket{${labels}}[5m]))`;
  return {
    reconciliations: `sum(rate(controller_runtime_reconcile_total{${labels}}[5m]))`,
    errors: `sum(rate(controller_runtime_reconcile_errors_total{${labels}}[5m]))`,
    durationP50: `histogram_quantile(0.5, ${buckets})`,
    durationP95: `histogram_quantile(0.95, ${buckets})`,
    queue: `sum(workqueue_depth{${labels},name="${controller}"})`,
    activeWorkers: `sum(controller_runtime_active_workers{${labels}})`,
    maxWorkers: `sum(controller_runtime_max_concurrent_reconciles{${labels}})`,
  };
}
