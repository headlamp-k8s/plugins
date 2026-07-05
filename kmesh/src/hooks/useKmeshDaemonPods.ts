/**
 * useKmeshDaemonPods — React hook that lists Kmesh daemon pods.
 *
 * Kmesh runs as a DaemonSet in the `kmesh-system` namespace with the label
 * `app=kmesh`.  This hook surfaces those pods so that other hooks and
 * components can pick a pod (typically the one on the same node as the
 * workload being inspected) and proxy requests to its admin API.
 *
 * Pattern: thin React wrapper around a plain async utility, with cleanup on unmount.
 */

import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { useCluster } from '@kinvolk/headlamp-plugin/lib/k8s';
import { useEffect, useState } from 'react';
import { KMESH_DAEMON_LABEL_SELECTOR, KMESH_NAMESPACE } from '../utils/kmeshDaemonApi';

// ---------------------------------------------------------------------------
// Minimal Pod shape — we only need name + node for routing decisions
// ---------------------------------------------------------------------------

export interface KmeshDaemonPod {
  /** Pod name (used to build the pod-proxy path). */
  name: string;
  /** Namespace (always `kmesh-system`). */
  namespace: string;
  /** Node the pod is scheduled on — handy for co-location routing. */
  nodeName: string;
  /** Pod phase (Running / Pending / …). */
  phase: string;
  /** Detailed reason for the pod's current state (e.g. CrashLoopBackOff) */
  statusReason?: string;
  /** True if the PodReady condition is met. */
  ready: boolean;
  /** Pod IP — informational. */
  podIP: string;
}

export interface UseKmeshDaemonPodsResult {
  /** True while the initial pod list fetch is in flight. */
  loading: boolean;
  /** Non-null when the fetch fails. */
  error: string | null;
  /** All kmesh-daemon pods found in the cluster. */
  pods: KmeshDaemonPod[];
  /** The first Running + Ready pod, or null if none are ready yet. */
  readyPod: KmeshDaemonPod | null;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

/**
 * Lists all Kmesh daemon pods in the `kmesh-system` namespace.
 *
 * @example
 * ```tsx
 * const { readyPod, loading, error } = useKmeshDaemonPods();
 * if (loading) return <CircularProgress />;
 * if (!readyPod) return <NotInstalledBanner />;
 * ```
 */
export function useKmeshDaemonPods(): UseKmeshDaemonPodsResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pods, setPods] = useState<KmeshDaemonPod[]>([]);
  const cluster = useCluster();

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPods([]);
    let cancelled = false;

    async function fetchPods() {
      try {
        const path =
          `/api/v1/namespaces/${KMESH_NAMESPACE}/pods` +
          `?labelSelector=${encodeURIComponent(KMESH_DAEMON_LABEL_SELECTOR)}`;

        type PodCondition = { type?: string; status?: string };
        type ContainerStateWaiting = { reason?: string };
        type ContainerStateTerminated = { reason?: string };
        type ContainerState = {
          waiting?: ContainerStateWaiting;
          terminated?: ContainerStateTerminated;
        };
        type ContainerStatus = { state?: ContainerState };
        type PodItem = {
          metadata?: { name?: string; namespace?: string };
          spec?: { nodeName?: string };
          status?: {
            phase?: string;
            reason?: string;
            podIP?: string;
            conditions?: PodCondition[];
            containerStatuses?: ContainerStatus[];
          };
        };
        type PodListResponse = { items?: PodItem[] };

        const response = (await ApiProxy.request(path)) as PodListResponse;
        if (cancelled) return;

        const items: KmeshDaemonPod[] = (response.items ?? []).map(item => {
          const ready = (item.status?.conditions ?? []).some(
            c => c.type === 'Ready' && c.status === 'True'
          );

          const phase = item.status?.phase ?? 'Unknown';
          let statusReason: string | undefined = item.status?.reason;
          const containerStatuses = item.status?.containerStatuses ?? [];
          if (!statusReason) {
            for (const status of containerStatuses) {
              if (status.state?.waiting?.reason) {
                statusReason = status.state.waiting.reason;
                break;
              } else if (status.state?.terminated?.reason) {
                statusReason = status.state.terminated.reason;
                break;
              }
            }
          }

          return {
            name: item.metadata?.name ?? '',
            namespace: item.metadata?.namespace ?? KMESH_NAMESPACE,
            nodeName: item.spec?.nodeName ?? '',
            phase,
            statusReason,
            ready,
            podIP: item.status?.podIP ?? '',
          };
        });

        setPods(items);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to list Kmesh daemon pods');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      await fetchPods();
      if (!cancelled) timeoutId = setTimeout(poll, 5000);
    };

    poll();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [cluster]);

  const readyPod = pods.find(p => p.phase === 'Running' && p.ready) ?? null;

  return { loading, error, pods, readyPod };
}
