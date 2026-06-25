/**
 * useDaemonRequest — generic React hook for fetching data from the Kmesh
 * daemon admin API via the Kubernetes pod-proxy tunnel.
 *
 * Design pattern:
 * - Thin React wrapper around the plain async `daemonRequestDeduped` utility.
 * - Returns a `DaemonRequestState<T>` (status / data / error) that drives
 *   loading spinners and error banners in components.
 * - Ignores the in-flight request result when the component unmounts
 *   (does not abort the network request).
 * - Re-fetches whenever `namespace`, `podName`, or `endpoint` change.
 *
 * @see src/utils/kmeshDaemonProxy.ts for the underlying fetch logic.
 * @see src/utils/kmeshDaemonApi.ts   for endpoint path constants.
 * @see src/hooks/useKmeshDaemonPods.ts to obtain a `podName`.
 *
 * @example
 * ```tsx
 * const { readyPod } = useKmeshDaemonPods();
 * const { status, data, error } = useDaemonRequest<KmeshVersion>(
 *   'kmesh-system',
 *   readyPod?.name ?? null,
 *   DAEMON_ENDPOINTS.VERSION
 * );
 * ```
 */

import { useCluster } from '@kinvolk/headlamp-plugin/lib/k8s';
import { useEffect, useState } from 'react';
import type {
  ConfigDump,
  DaemonRequestState,
  KmeshVersion,
  LoggerInfo,
  WorkloadBpfDump,
  WorkloadDump,
} from '../types/daemonApi';
import { DAEMON_ENDPOINTS, type DaemonEndpoint } from '../utils/kmeshDaemonApi';
import {
  daemonRequestDeduped,
  type DaemonRequestOptions,
  makeErrorState,
  makeLoadingState,
  makeSuccessState,
} from '../utils/kmeshDaemonProxy';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches data from a Kmesh daemon endpoint and tracks request lifecycle.
 *
 * Pass `null` for `podName` to put the hook in "idle" state (nothing fetched).
 * This is useful while `useKmeshDaemonPods` is still resolving the ready pod.
 *
 * @param namespace  - Namespace of the daemon pod (usually "kmesh-system")
 * @param podName    - Pod to proxy through, or `null` to skip the request
 * @param endpoint   - Admin API endpoint (use DAEMON_ENDPOINTS constants)
 * @param options    - Optional query params / request body
 */
export function useDaemonRequest<T = unknown>(
  namespace: string,
  podName: string | null,
  endpoint: DaemonEndpoint,
  options?: Pick<DaemonRequestOptions, 'queryParams' | 'body' | 'method'>
): DaemonRequestState<T> {
  const [state, setState] = useState<DaemonRequestState<T>>(
    podName ? makeLoadingState<T>() : { status: 'idle', data: null, error: null }
  );
  const cluster = useCluster();

  // Serialise options into stable deps so the effect doesn't re-fire on
  // every render when the caller passes an inline object literal.
  const method = options?.method ?? (options?.body !== undefined ? 'POST' : 'GET');

  const queryParamsKey = (() => {
    const qp = options?.queryParams;
    if (!qp || Object.keys(qp).length === 0) return '';
    return new URLSearchParams(
      Object.entries(qp).sort(([a], [b]) => a.localeCompare(b))
    ).toString();
  })();

  const bodyKey = (() => {
    if (options?.body === undefined) return '';
    try {
      return JSON.stringify(options.body);
    } catch {
      // Avoid throwing during render; the request itself will fail and be reported via error state.
      return '__unserializable_body__';
    }
  })();

  useEffect(() => {
    if (!podName) {
      setState({ status: 'idle', data: null, error: null });
      return;
    }

    let cancelled = false;
    setState(makeLoadingState<T>());

    daemonRequestDeduped<T>(namespace, podName, endpoint, {
      method,
      queryParams: options?.queryParams,
      body: options?.body,
    })
      .then(data => {
        if (!cancelled) setState(makeSuccessState<T>(data));
      })
      .catch(err => {
        if (!cancelled) setState(makeErrorState<T>(err));
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cluster, namespace, podName, endpoint, method, queryParamsKey, bodyKey]);

  return state;
}

// ---------------------------------------------------------------------------
// Convenience typed hooks — one per read endpoint
// ---------------------------------------------------------------------------

/**
 * Fetches the daemon version from `/version`.
 *
 * @example
 * const { data: version } = useKmeshVersion('kmesh-system', pod?.name ?? null);
 */
export function useKmeshVersion(namespace: string, podName: string | null) {
  return useDaemonRequest<KmeshVersion>(namespace, podName, DAEMON_ENDPOINTS.VERSION);
}

/**
 * Fetches the workload config dump from `/debug/config_dump/dual-engine`.
 * Returns 400 (error state) if the daemon is running in kernel-native mode.
 */
export function useWorkloadConfigDump(namespace: string, podName: string | null) {
  return useDaemonRequest<WorkloadDump>(namespace, podName, DAEMON_ENDPOINTS.CONFIG_DUMP_WORKLOAD);
}

/**
 * Fetches the ADS / kernel-native config dump from
 * `/debug/config_dump/kernel-native`.
 * Returns 400 (error state) if the daemon is running in dual-engine mode.
 */
export function useAdsConfigDump(namespace: string, podName: string | null) {
  return useDaemonRequest<ConfigDump>(namespace, podName, DAEMON_ENDPOINTS.CONFIG_DUMP_ADS);
}

/**
 * Fetches the BPF map dump for dual-engine mode
 * from `/debug/config_dump/bpf/dual-engine`.
 */
export function useWorkloadBpfMaps(namespace: string, podName: string | null) {
  return useDaemonRequest<WorkloadBpfDump>(namespace, podName, DAEMON_ENDPOINTS.BPF_WORKLOAD_MAPS);
}

/**
 * Fetches the BPF map dump for kernel-native mode
 * from `/debug/config_dump/bpf/kernel-native`.
 */
export function useAdsBpfMaps(namespace: string, podName: string | null) {
  return useDaemonRequest<unknown>(namespace, podName, DAEMON_ENDPOINTS.BPF_ADS_MAPS);
}

/**
 * Fetches the list of available loggers from `/debug/loggers`.
 */
export function useKmeshLoggers(namespace: string, podName: string | null) {
  return useDaemonRequest<string[]>(namespace, podName, DAEMON_ENDPOINTS.LOGGERS);
}

/**
 * Fetches the level for a single named logger.
 */
export function useKmeshLoggerLevel(namespace: string, podName: string | null, loggerName: string) {
  return useDaemonRequest<LoggerInfo>(namespace, podName, DAEMON_ENDPOINTS.LOGGERS, {
    queryParams: { name: loggerName },
  });
}
