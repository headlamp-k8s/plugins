/**
 * Kmesh Daemon Admin API — endpoint constants and pod-proxy path builder.
 *
 * The Kmesh daemon runs an HTTP admin server on port 15200 (localhost-only)
 * inside every kmesh-daemon DaemonSet pod.  Headlamp reaches it through the
 * Kubernetes API Server pod-proxy tunnel:
 *
 *   /api/v1/namespaces/<ns>/pods/<pod>:<port>/proxy/<endpoint>
 *
 * This is the same pattern used by tools like `kubectl port-forward` or
 * istioctl proxy-config to reach cluster-local APIs.
 *
 * @see pkg/status/status_server.go for the authoritative endpoint list.
 */

// ---------------------------------------------------------------------------
// Core constants
// ---------------------------------------------------------------------------

/** Port the Kmesh daemon admin HTTP server listens on. */
export const KMESH_DAEMON_PORT = 15200;

/** Namespace where the kmesh-daemon DaemonSet runs. */
export const KMESH_NAMESPACE = 'kmesh-system';

/** Label selector for kmesh daemon pods. */
export const KMESH_DAEMON_LABEL_SELECTOR = 'app=kmesh';

// ---------------------------------------------------------------------------
// Endpoint path constants  (matching status_server.go)
// ---------------------------------------------------------------------------

export const DAEMON_ENDPOINTS = {
  /** GET → KmeshVersion JSON */
  VERSION: '/version',

  /** GET → "OK" string — use as liveness/readiness check */
  READY: '/debug/ready',

  /**
   * GET  → string[] (logger names) when no ?name= param
   * GET  → LoggerInfo when ?name=<logger>
   * POST → (body: LoggerInfo) to change a logger level
   */
  LOGGERS: '/debug/loggers',

  /**
   * GET → ConfigDump (proto-JSON, ADS / kernel-native mode).
   * Returns 400 if daemon is running in workload mode.
   */
  CONFIG_DUMP_ADS: '/debug/config_dump/kernel-native',

  /**
   * GET → WorkloadDump JSON (dual-engine / workload mode).
   * Returns 400 if daemon is running in kernel-native mode.
   */
  CONFIG_DUMP_WORKLOAD: '/debug/config_dump/dual-engine',

  /**
   * GET → BPF map dump (ADS / kernel-native mode).
   * Returns 400 if daemon is running in workload mode.
   */
  BPF_ADS_MAPS: '/debug/config_dump/bpf/kernel-native',

  /**
   * GET → WorkloadBpfDump JSON (dual-engine / workload mode).
   * Returns 400 if daemon is running in kernel-native mode.
   */
  BPF_WORKLOAD_MAPS: '/debug/config_dump/bpf/dual-engine',

  /**
   * POST /accesslog?enable=<bool>
   * Toggles workload access logging.
   */
  ACCESSLOG: '/accesslog',

  /**
   * POST /monitoring?enable=<bool>
   * Master switch — enables/disables all monitoring (metrics + accesslog).
   */
  MONITORING: '/monitoring',

  /**
   * POST /workload_metrics?enable=<bool>
   * Toggles per-workload metrics collection.
   */
  WORKLOAD_METRICS: '/workload_metrics',

  /**
   * POST /connection_metrics?enable=<bool>
   * Toggles per-connection metrics collection.
   */
  CONNECTION_METRICS: '/connection_metrics',

  /**
   * POST /authz?enable=<bool>
   * Toggles eBPF authorization offloading.
   */
  AUTHZ: '/authz',
} as const;

export type DaemonEndpoint = (typeof DAEMON_ENDPOINTS)[keyof typeof DAEMON_ENDPOINTS];

// ---------------------------------------------------------------------------
// Pod-proxy path builder
// ---------------------------------------------------------------------------

/**
 * Builds the Kubernetes API Server pod-proxy URL for a Kmesh daemon endpoint.
 *
 * Headlamp's `ApiProxy.request()` prepends the cluster API server base URL,
 * so this function only needs to return the path segment after that base.
 *
 * @param namespace   - Namespace of the kmesh daemon pod (usually "kmesh-system")
 * @param podName     - Name of the kmesh daemon pod
 * @param endpoint    - One of the DAEMON_ENDPOINTS values
 * @param queryParams - Optional key/value pairs appended as query string
 *
 * @example
 * buildDaemonProxyPath('kmesh-system', 'kmesh-daemon-abc12', DAEMON_ENDPOINTS.VERSION)
 * // → "/api/v1/namespaces/kmesh-system/pods/kmesh-daemon-abc12:15200/proxy/version"
 *
 * buildDaemonProxyPath('kmesh-system', 'kmesh-daemon-abc12', DAEMON_ENDPOINTS.ACCESSLOG, { enable: 'true' })
 * // → "/api/v1/namespaces/kmesh-system/pods/kmesh-daemon-abc12:15200/proxy/accesslog?enable=true"
 */
export function buildDaemonProxyPath(
  namespace: string,
  podName: string,
  endpoint: DaemonEndpoint,
  queryParams?: Record<string, string>
): string {
  // The Kubernetes pod proxy path strips the leading '/' from the sub-path,
  // so we normalise it here.
  const subPath = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  let path =
    `/api/v1/namespaces/${namespace}/pods/` + `${podName}:${KMESH_DAEMON_PORT}/proxy/${subPath}`;

  if (queryParams && Object.keys(queryParams).length > 0) {
    const qs = new URLSearchParams(
      Object.entries(queryParams).sort(([a], [b]) => a.localeCompare(b))
    ).toString();
    path = `${path}?${qs}`;
  }

  return path;
}

/**
 * Convenience overload that uses the default Kmesh namespace and port.
 *
 * @example
 * buildDefaultDaemonProxyPath('kmesh-daemon-abc12', DAEMON_ENDPOINTS.READY)
 * // → "/api/v1/namespaces/kmesh-system/pods/kmesh-daemon-abc12:15200/proxy/debug/ready"
 */
export function buildDefaultDaemonProxyPath(
  podName: string,
  endpoint: DaemonEndpoint,
  queryParams?: Record<string, string>
): string {
  return buildDaemonProxyPath(KMESH_NAMESPACE, podName, endpoint, queryParams);
}
