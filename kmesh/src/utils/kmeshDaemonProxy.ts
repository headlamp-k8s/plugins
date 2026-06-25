/**
 * Kmesh Daemon Proxy — core fetch logic for the admin API on port 15200.
 *
 * Design pattern:
 * - A single shared module-level in-flight promise per (pod, endpoint) key
 *   prevents duplicate in-flight requests when multiple components mount.
 * - Results are returned as plain async functions so hooks can wrap them with
 *   React state; the cache layer lives here, not in React state.
 *
 * Why pod-proxy instead of port-forward?
 * ----------------------------------------
 * The Kmesh daemon binds on *localhost*:15200, so it is reachable only from
 * within the pod.  The Kubernetes API Server pod-proxy mechanism
 * (`/api/v1/namespaces/<ns>/pods/<name>:<port>/proxy/…`) tunnels HTTP
 * requests through the API server to the pod without requiring `kubectl
 * port-forward` or an Ingress.  This is exactly the same mechanism that
 * `kmeshctl` uses under the hood when it calls the daemon admin endpoints.
 *
 * @see src/utils/kmeshDaemonApi.ts for endpoint constants and path builder.
 * @see src/hooks/useDaemonRequest.ts for the React hook wrapper.
 */

import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';
import type { DaemonRequestState } from '../types/daemonApi';
import { buildDaemonProxyPath, DAEMON_ENDPOINTS, type DaemonEndpoint } from './kmeshDaemonApi';

// ---------------------------------------------------------------------------
// Internal request options
// ---------------------------------------------------------------------------

export interface DaemonRequestOptions {
  method?: 'GET' | 'POST';
  /** Query parameters appended to the URL. */
  queryParams?: Record<string, string>;
  /** JSON-serialisable body for POST requests. */
  body?: unknown;
  /** AbortSignal for cancellation (e.g. from React useEffect cleanup). */
  signal?: AbortSignal;
  /** Whether ApiProxy should parse the response body as JSON (defaults to true). */
  isJSON?: boolean;
}

// ---------------------------------------------------------------------------
// Core request function
// ---------------------------------------------------------------------------

/**
 * Sends a request to the Kmesh daemon admin API via the Kubernetes API Server
 * pod-proxy tunnel and returns the response body as returned by `ApiProxy.request()`.
 *
 * Throws on HTTP errors or network failures so that callers / hooks can handle
 * the error state themselves.
 *
 * @param namespace   - Namespace the daemon pod runs in
 * @param podName     - Name of the daemon pod
 * @param endpoint    - Daemon endpoint path (e.g. DAEMON_ENDPOINTS.VERSION)
 * @param options     - Optional method, queryParams, body, signal
 * @returns           - Parsed JSON response (typed as T by the caller)
 *
 * @example
 * const version = await daemonRequest<KmeshVersion>(
 *   'kmesh-system',
 *   'kmesh-daemon-xyz',
 *   DAEMON_ENDPOINTS.VERSION
 * );
 */
export async function daemonRequest<T = unknown>(
  namespace: string,
  podName: string,
  endpoint: DaemonEndpoint,
  options: DaemonRequestOptions = {}
): Promise<T> {
  const { method: methodOverride, queryParams, body, signal, isJSON = true } = options;
  const method = methodOverride ?? (body !== undefined ? 'POST' : 'GET');

  if (body !== undefined && method === 'GET') {
    throw new Error('daemonRequest: GET requests cannot include a request body');
  }

  const path = buildDaemonProxyPath(namespace, podName, endpoint, queryParams);

  const requestInit: RequestInit & { isJSON?: boolean } = { method, signal, isJSON };
  if (body !== undefined) {
    requestInit.headers = { 'Content-Type': 'application/json' };
    requestInit.body = JSON.stringify(body);
  }

  // ApiProxy.request returns parsed JSON by default.
  // When `isJSON: false` is passed, it returns the raw `Response` so callers can inspect status/body.
  // It automatically picks up the current cluster context set in Headlamp.
  const result = await ApiProxy.request(path, requestInit);
  return result as T;
}

// ---------------------------------------------------------------------------
// Module-level in-flight promise cache
// ---------------------------------------------------------------------------

const _inFlight = new Map<string, Promise<unknown>>();

function cacheKey(
  namespace: string,
  podName: string,
  endpoint: DaemonEndpoint,
  method: string,
  queryParams?: Record<string, string>
): string {
  const qs =
    queryParams && Object.keys(queryParams).length > 0
      ? new URLSearchParams(
          Object.entries(queryParams).sort(([a], [b]) => a.localeCompare(b))
        ).toString()
      : '';
  const cluster = getCluster() || 'default';
  return `${cluster}|${method}|${namespace}|${podName}|${endpoint}|${qs}`;
}

/**
 * Like `daemonRequest` but deduplicates concurrent calls with the same
 * (cluster, namespace, podName, endpoint, method, queryParams) key.
 * The in-flight promise is cleared after it resolves or rejects so the next
 * call always re-fetches fresh data.
 *
 * Use this for expensive read-only GET requests (e.g. config dumps, BPF maps)
 * that multiple components might trigger simultaneously on page load.
 */
export async function daemonRequestDeduped<T = unknown>(
  namespace: string,
  podName: string,
  endpoint: DaemonEndpoint,
  options: DaemonRequestOptions = {}
): Promise<T> {
  const { method = 'GET', queryParams, body, signal, isJSON = true } = options;

  // Avoid deduping non-idempotent requests (or requests tied to a caller-specific AbortSignal).
  // Also avoid deduping when isJSON is false because the return type/shape differs (raw Response vs parsed JSON).
  if (method !== 'GET' || body !== undefined || signal || isJSON === false) {
    return daemonRequest<T>(namespace, podName, endpoint, options);
  }

  const key = cacheKey(namespace, podName, endpoint, method, queryParams);

  const existing = _inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = daemonRequest<T>(namespace, podName, endpoint, options).finally(() => {
    _inFlight.delete(key);
  });

  _inFlight.set(key, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// Readiness probe helper
// ---------------------------------------------------------------------------

/**
 * Checks whether the Kmesh daemon on the given pod is ready.
 * Returns `true` if the `/debug/ready` endpoint responds with HTTP 200.
 *
 * @example
 * const ready = await isDaemonReady('kmesh-system', 'kmesh-daemon-abc12');
 */
export async function isDaemonReady(namespace: string, podName: string): Promise<boolean> {
  try {
    const res = await daemonRequest<Response>(namespace, podName, DAEMON_ENDPOINTS.READY, {
      isJSON: false,
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Toggle helpers (POST endpoints)
// ---------------------------------------------------------------------------

export type ToggleEndpoint =
  | typeof DAEMON_ENDPOINTS.ACCESSLOG
  | typeof DAEMON_ENDPOINTS.MONITORING
  | typeof DAEMON_ENDPOINTS.WORKLOAD_METRICS
  | typeof DAEMON_ENDPOINTS.CONNECTION_METRICS
  | typeof DAEMON_ENDPOINTS.AUTHZ;

/**
 * Sends a POST request to a toggle endpoint on the Kmesh daemon.
 *
 * @param namespace  - Namespace of the daemon pod
 * @param podName    - Name of the daemon pod
 * @param endpoint   - One of the POST-only toggle endpoints
 * @param enable     - Whether to enable or disable the feature
 *
 * @example
 * await toggleDaemonFeature('kmesh-system', 'kmesh-daemon-abc12', '/accesslog', true);
 */
export async function toggleDaemonFeature(
  namespace: string,
  podName: string,
  endpoint: ToggleEndpoint,
  enable: boolean
): Promise<void> {
  const res = await daemonRequest<Response>(namespace, podName, endpoint, {
    method: 'POST',
    queryParams: { enable: String(enable) },
    isJSON: false,
  });
  if (!res.ok) {
    throw new Error(`Kmesh daemon toggle failed: ${res.status} ${res.statusText}`);
  }
}

// ---------------------------------------------------------------------------
// Serialise a DaemonRequestState for initial render (before data arrives)
// ---------------------------------------------------------------------------

/**
 * Returns the canonical "loading" initial state for `useDaemonRequest`.
 * Factored out here so both the hook and tests reuse the same implementation.
 */
export function makeLoadingState<T>(): DaemonRequestState<T> {
  return { status: 'loading', data: null, error: null };
}

/**
 * Returns a success state wrapping `data`.
 */
export function makeSuccessState<T>(data: T): DaemonRequestState<T> {
  return { status: 'success', data, error: null };
}

/**
 * Returns an error state with a human-readable message.
 */
export function makeErrorState<T>(error: unknown): DaemonRequestState<T> {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : 'Unknown error contacting the Kmesh daemon';
  return { status: 'error', data: null, error: message };
}
