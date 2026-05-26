// Matches all CAPI controller-manager scrape jobs (core, bootstrap, control-plane).
export const CAPI_JOB_PATTERN = '.*capi.*controller-manager.*';
const CAPI_CACHE_LOOKBACK = '30m';
const CAPI_CACHE_LOOKBACK_SECONDS = 30 * 60;

/**
 * Builds a PromQL selector for CAPI controller metrics.
 *
 * @param extra - Additional label matchers to append to the selector.
 * @returns The constructed PromQL selector string.
 */
export function capiJobSelector(extra = ''): string {
  return `{job=~"${CAPI_JOB_PATTERN}"${extra}}`;
}

/**
 * Generates a query for the reconcile rate.
 * Prefers capi_* metrics with controller_runtime_* fallback (CAPI Grafana dashboard pattern).
 *
 * @param controller - The name of the controller.
 * @param result - The result of the reconciliation (e.g., 'success', 'error').
 * @returns The PromQL query string.
 */
export function capiReconcileRateQuery(controller: string, result: string): string {
  const selector = capiJobSelector(`,controller="${controller}",result="${result}"`);
  const query =
    `sum(rate(capi_reconcile_total${selector}[5m]))` +
    ` or sum(rate(controller_runtime_reconcile_total${selector}[5m]))`;
  return `(${query}) or vector(0)`;
}

/**
 * Generates a query for the reconcile error rate.
 *
 * @param controller - The name of the controller.
 * @returns The PromQL query string.
 */
export function capiReconcileErrorRateQuery(controller: string): string {
  const capiSelector = capiJobSelector(`,controller="${controller}",result!="success"`);
  const runtimeSelector = capiJobSelector(`,controller="${controller}"`);
  const query =
    `sum(rate(capi_reconcile_total${capiSelector}[5m]))` +
    ` or sum(rate(controller_runtime_reconcile_errors_total${runtimeSelector}[5m]))`;
  return `(${query}) or vector(0)`;
}

/**
 * Generates a query for the reconcile duration at a specific quantile.
 *
 * @param controller - The name of the controller.
 * @param quantile - The quantile to calculate (e.g., 0.5 for median, 0.99 for p99).
 * @returns The PromQL query string.
 */
export function capiReconcileDurationQuery(controller: string, quantile: number): string {
  const selector = capiJobSelector(`,controller="${controller}"`);
  const q = quantile.toFixed(2);
  const query =
    `histogram_quantile(${q}, sum(rate(capi_reconcile_time_seconds_bucket${selector}[5m])) by (le))` +
    ` or histogram_quantile(${q}, sum(rate(controller_runtime_reconcile_time_seconds_bucket${selector}[5m])) by (le))`;
  return `(${query}) or vector(0)`;
}

/**
 * Generates a query for the rate of Server-Side Apply (SSA) cache hits.
 *
 * @param controller - The name of the controller.
 * @returns The PromQL query string.
 */
export function capiSsaCacheHitsRateQuery(controller: string): string {
  // SSA cache has controller + kind labels; sum all kinds for this controller
  const selector = capiJobSelector(`,controller="${controller}"`);
  return `sum(rate(capi_ssa_cache_hits_total${selector}[5m])) or vector(0)`;
}

/**
 * Generates a query for the rate of Server-Side Apply (SSA) cache misses.
 *
 * @param controller - The name of the controller.
 * @returns The PromQL query string.
 */
export function capiSsaCacheMissesRateQuery(controller: string): string {
  const selector = capiJobSelector(`,controller="${controller}"`);
  return `sum(rate(capi_ssa_cache_misses_total${selector}[5m])) or vector(0)`;
}

/**
 * Returns the webhook path suffix pattern used by CAPI admission webhooks (e.g., v1beta2-machinedeployment).
 *
 * @param kind - The resource kind handled by the webhook.
 * @returns The regex pattern string.
 */
export function capiWebhookPattern(kind: string): string {
  return `.*v1beta2-${kind.toLowerCase()}$`;
}

/**
 * Generates a query for the admission webhook request rate.
 *
 * @param kind - The resource kind handled by the webhook.
 * @param success - True for successful requests (2xx status), false otherwise.
 * @returns The PromQL query string.
 */
export function capiWebhookRateQuery(kind: string, success: boolean): string {
  const codeMatcher = success ? 'code=~"2.."' : 'code!~"2.."';
  const selector = capiJobSelector(`,webhook=~"${capiWebhookPattern(kind)}",${codeMatcher}`);
  return `sum(rate(controller_runtime_webhook_requests_total${selector}[5m])) or vector(0)`;
}

/**
 * Generates a query for the admission webhook latency at a specific quantile.
 *
 * @param kind - The resource kind handled by the webhook.
 * @param quantile - The quantile to calculate (e.g., 0.5 for median, 0.99 for p99).
 * @returns The PromQL query string.
 */
export function capiWebhookDurationQuery(kind: string, quantile: number): string {
  const selector = capiJobSelector(`,webhook=~"${capiWebhookPattern(kind)}"`);
  const q = quantile.toFixed(2);
  return (
    `histogram_quantile(${q}, sum(rate(controller_runtime_webhook_latency_seconds_bucket${selector}[5m])) by (le))` +
    ` or vector(0)`
  );
}

/**
 * Generates a query for the cluster cache health check rate.
 *
 * @param clusterName - The name of the cluster.
 * @param namespace - The namespace of the cluster.
 * @param success - True for successful health checks, false otherwise.
 * @returns The PromQL query string.
 */
export function capiClusterCacheHealthcheckRateQuery(
  clusterName: string,
  namespace: string,
  success: boolean
): string {
  const statusMatcher = success ? 'status="success"' : 'status!="success"';
  const selector = capiJobSelector(
    `,cluster_name="${clusterName}",cluster_namespace="${namespace}",${statusMatcher}`
  );
  return (
    `(sum(increase(capi_cluster_cache_healthchecks_total${selector}[${CAPI_CACHE_LOOKBACK}]))` +
    ` / ${CAPI_CACHE_LOOKBACK_SECONDS}) or vector(0)`
  );
}

/**
 * Generates a query indicating whether the cluster cache connection is up.
 *
 * @param clusterName - The name of the cluster.
 * @param namespace - The namespace of the cluster.
 * @returns The PromQL query string.
 */
export function capiClusterCacheConnectionUpQuery(clusterName: string, namespace: string): string {
  const selector = capiJobSelector(
    `,cluster_name="${clusterName}",cluster_namespace="${namespace}"`
  );
  return `max(max_over_time(capi_cluster_cache_connection_up${selector}[${CAPI_CACHE_LOOKBACK}])) or vector(0)`;
}

/**
 * Generates a query indicating the overall health check status of the cluster cache.
 *
 * @param clusterName - The name of the cluster.
 * @param namespace - The namespace of the cluster.
 * @returns The PromQL query string.
 */
export function capiClusterCacheHealthcheckQuery(clusterName: string, namespace: string): string {
  const selector = capiJobSelector(
    `,cluster_name="${clusterName}",cluster_namespace="${namespace}"`
  );
  return `max(max_over_time(capi_cluster_cache_healthcheck${selector}[${CAPI_CACHE_LOOKBACK}])) or vector(0)`;
}

/**
 * Generates a query for the average wait duration for the client cache.
 *
 * @returns The PromQL query string.
 */
export function capiClientCacheWaitDurationQuery(): string {
  const selector = capiJobSelector();
  // Guard against NaN when count is 0 by falling back to 0
  return (
    `(sum(rate(capi_client_cache_wait_duration_seconds_sum${selector}[5m]))` +
    ` / sum(rate(capi_client_cache_wait_duration_seconds_count${selector}[5m])))` +
    ` or vector(0)`
  );
}

/**
 * Generates a query for the number of currently active workers for a controller.
 *
 * @param controller - The name of the controller.
 * @returns The PromQL query string.
 */
export function capiActiveWorkersQuery(controller: string): string {
  const selector = capiJobSelector(`,controller="${controller}"`);
  return `sum(controller_runtime_active_workers${selector}) or vector(0)`;
}

/**
 * Generates a query for the maximum number of concurrent reconciles configured for a controller.
 *
 * @param controller - The name of the controller.
 * @returns The PromQL query string.
 */
export function capiMaxConcurrentReconcilesQuery(controller: string): string {
  const selector = capiJobSelector(`,controller="${controller}"`);
  return `max(controller_runtime_max_concurrent_reconciles${selector}) or vector(0)`;
}

/**
 * Generates a query for the current depth of a controller's workqueue.
 *
 * @param controller - The name of the controller.
 * @returns The PromQL query string.
 */
export function capiWorkqueueDepthQuery(controller: string): string {
  const selector = capiJobSelector(`,name="${controller}"`);
  return `sum(workqueue_depth${selector}) or vector(0)`;
}

/**
 * Generates a query for the rate of items added to a controller's workqueue.
 *
 * @param controller - The name of the controller.
 * @returns The PromQL query string.
 */
export function capiWorkqueueAddsRateQuery(controller: string): string {
  const selector = capiJobSelector(`,name="${controller}"`);
  return `sum(rate(workqueue_adds_total${selector}[5m])) or vector(0)`;
}

/**
 * Generates a query for the rate of retries in a controller's workqueue.
 *
 * @param controller - The name of the controller.
 * @returns The PromQL query string.
 */
export function capiWorkqueueRetriesRateQuery(controller: string): string {
  const selector = capiJobSelector(`,name="${controller}"`);
  return `sum(rate(workqueue_retries_total${selector}[5m])) or vector(0)`;
}
