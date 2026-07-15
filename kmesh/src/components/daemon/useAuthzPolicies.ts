/**
 * useAuthzPolicies — fetches and slices the authorization policy list from
 * the Kmesh workload config dump endpoint.
 *
 * Returns 400 (error state) if the daemon is in kernel-native mode —
 * the component shows a graceful fallback in that case.
 *
 * @example
 * ```tsx
 * const { status, data: policies } = useAuthzPolicies('kmesh-system', readyPod?.name ?? null);
 * ```
 */

import { useWorkloadConfigDump } from '../../hooks/useDaemonRequest';
import type { DaemonAuthorizationPolicy, DaemonRequestState } from '../../types/daemonApi';

export function useAuthzPolicies(
  namespace: string,
  podName: string | null
): DaemonRequestState<DaemonAuthorizationPolicy[]> {
  const raw = useWorkloadConfigDump(namespace, podName);

  return {
    status: raw.status,
    error: raw.error,
    data: raw.status === 'success' ? raw.data?.policies ?? [] : null,
  };
}
