import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

const DEFAULT_CLUSTER_KEY = '__default__';

/** Maximum number of concurrent per-node SelfSubjectAccessReview requests. */
export const MAX_CONCURRENT_NODE_AUTH_CHECKS = 4;

/** Maximum automatic retry attempts for transient request failures (per failure episode). */
export const MAX_AUTH_RETRY_ATTEMPTS = 2;

/** Base delay in milliseconds before retrying a failed authorization check (scales with attempt). */
export const AUTH_RETRY_DELAY_MS = 2000;

function clusterKey(cluster?: string): string {
  return cluster || DEFAULT_CLUSTER_KEY;
}

function nodeKey(cluster: string, nodeName: string): string {
  return `${cluster}\0${nodeName}`;
}

/**
 * Target Kubernetes scope used to check `nodes` `get` RBAC permission.
 * When `nodeName` is omitted, only the cluster-wide fast path runs upfront and
 * per-node checks can be requested lazily via `requestNodeAuth` for visible rows.
 */
export interface NodeAuthTarget {
  cluster?: string;
  nodeName?: string;
}

/**
 * Returned RBAC handle for checking and lazily requesting per-node authorization.
 */
export interface NodeAuthController {
  canGetNode: (cluster?: string, nodeName?: string) => boolean;
  requestNodeAuth: (cluster?: string, nodeName?: string) => void;
  subscribe: (listener: () => void) => () => void;
}

interface PendingNodeAuthEntry {
  nKey: string;
  cKey: string;
  cluster?: string;
  nodeName: string;
}

interface NodeAuthStoreState {
  allowedByCluster: Record<string, boolean>;
  allowedByNode: Record<string, boolean>;
  checkedClusters: Set<string>;
  checkedNodes: Set<string>;
  failedClusters: Set<string>;
  failedNodes: Set<string>;
  clusterRetries: Map<string, number>;
  nodeRetries: Map<string, number>;
  retryTimers: Set<ReturnType<typeof setTimeout>>;
  pendingByCluster: Map<string, PendingNodeAuthEntry[]>;
  queue: PendingNodeAuthEntry[];
  inFlightCount: number;
  mounted: boolean;
  version: number;
  listeners: Set<() => void>;
}

/**
 * Queries RBAC `get` authorization on Kubernetes `nodes` once per distinct cluster as a fast path.
 * When cluster-wide `get` on `nodes` is denied, supports lazy per-node `{ name: nodeName }` fallback
 * checks (for `resourceNames`-scoped grants) queued with a bounded concurrency limit so large lists
 * only probe visible rows without bursting SelfSubjectAccessReview requests.
 * Distinguishes transient request failures from explicit RBAC denials by scheduling bounded retries
 * and invalidating exhausted failures on refresh instead of permanently caching network errors.
 */
export function useCanGetNodes(
  targets: Array<NodeAuthTarget | string | undefined>
): NodeAuthController {
  const { clusterEntries, explicitNodeEntries } = useMemo(() => {
    const cMap = new Map<string, string | undefined>();
    const nMap = new Map<string, PendingNodeAuthEntry>();

    for (const target of targets) {
      const cluster =
        typeof target === 'string'
          ? target
          : typeof target === 'object' && target !== null
          ? target.cluster
          : undefined;
      const nodeName = typeof target === 'object' && target !== null ? target.nodeName : undefined;
      const cKey = clusterKey(cluster);

      if (!cMap.has(cKey)) {
        cMap.set(cKey, cluster);
      }

      if (nodeName) {
        const nKey = nodeKey(cKey, nodeName);
        if (!nMap.has(nKey)) {
          nMap.set(nKey, { nKey, cKey, cluster, nodeName });
        }
      }
    }

    return {
      clusterEntries: Array.from(cMap.entries()).sort(([a], [b]) => a.localeCompare(b)),
      explicitNodeEntries: Array.from(nMap.values()).sort((a, b) => a.nKey.localeCompare(b.nKey)),
    };
  }, [targets]);

  const clustersSignature = useMemo(
    () => clusterEntries.map(([key]) => key).join('\0'),
    [clusterEntries]
  );

  const explicitNodesSignature = useMemo(
    () => explicitNodeEntries.map(entry => entry.nKey).join('\0'),
    [explicitNodeEntries]
  );

  const storeRef = useRef<NodeAuthStoreState | null>(null);
  if (!storeRef.current) {
    storeRef.current = {
      allowedByCluster: {},
      allowedByNode: {},
      checkedClusters: new Set(),
      checkedNodes: new Set(),
      failedClusters: new Set(),
      failedNodes: new Set(),
      clusterRetries: new Map(),
      nodeRetries: new Map(),
      retryTimers: new Set(),
      pendingByCluster: new Map(),
      queue: [],
      inFlightCount: 0,
      mounted: true,
      version: 0,
      listeners: new Set(),
    };
  }

  const notify = useCallback(() => {
    const store = storeRef.current!;
    store.version += 1;
    for (const listener of store.listeners) {
      listener();
    }
  }, []);

  const subscribe = useCallback((listener: () => void) => {
    const store = storeRef.current!;
    store.listeners.add(listener);
    return () => {
      store.listeners.delete(listener);
    };
  }, []);

  const getVersion = useCallback(() => storeRef.current!.version, []);

  // Re-render hook caller (e.g., EvaluationDetails) when store version advances.
  useSyncExternalStore(subscribe, getVersion, getVersion);

  const scheduleRetry = useCallback((callback: () => void, attempt: number) => {
    const store = storeRef.current!;
    const delay = AUTH_RETRY_DELAY_MS * (attempt + 1);
    const timer = setTimeout(() => {
      store.retryTimers.delete(timer);
      if (!store.mounted) {
        return;
      }
      callback();
    }, delay);
    store.retryTimers.add(timer);
  }, []);

  const pumpQueue = useCallback(() => {
    const store = storeRef.current!;
    const getAuthorization = K8s?.ResourceClasses?.Node?.getAuthorization;
    if (!store.mounted || typeof getAuthorization !== 'function') {
      return;
    }

    while (
      store.mounted &&
      store.inFlightCount < MAX_CONCURRENT_NODE_AUTH_CHECKS &&
      store.queue.length > 0
    ) {
      const entry = store.queue.shift()!;
      if (store.allowedByCluster[entry.cKey] !== false) {
        continue;
      }

      store.inFlightCount += 1;

      Promise.resolve(
        getAuthorization.call(
          K8s.ResourceClasses.Node,
          'get',
          { name: entry.nodeName },
          entry.cluster
        )
      )
        .then(res => {
          if (!store.mounted) return;
          store.nodeRetries.delete(entry.nKey);
          store.failedNodes.delete(entry.nKey);
          const allowed = Boolean(res?.status?.allowed);
          if (store.allowedByNode[entry.nKey] !== allowed) {
            store.allowedByNode[entry.nKey] = allowed;
            notify();
          }
        })
        .catch(() => {
          if (!store.mounted) return;
          const attempt = store.nodeRetries.get(entry.nKey) ?? 0;
          if (attempt < MAX_AUTH_RETRY_ATTEMPTS) {
            store.nodeRetries.set(entry.nKey, attempt + 1);
            scheduleRetry(() => {
              if (store.allowedByCluster[entry.cKey] !== false) {
                return;
              }
              store.queue.push(entry);
              pumpQueue();
            }, attempt);
            return;
          }
          // Mark as transiently failed after bounded retries so a subsequent refresh can re-try.
          store.failedNodes.add(entry.nKey);
        })
        .finally(() => {
          store.inFlightCount = Math.max(0, store.inFlightCount - 1);
          pumpQueue();
        });
    }
  }, [notify, scheduleRetry]);

  const requestNodeAuth = useCallback(
    (cluster?: string, nodeName?: string) => {
      if (!nodeName) {
        return;
      }
      const store = storeRef.current!;
      const cKey = clusterKey(cluster);
      if (store.allowedByCluster[cKey] === true) {
        return;
      }

      const nKey = nodeKey(cKey, nodeName);
      if (store.failedNodes.has(nKey)) {
        // Invalidate exhausted transient failure on subsequent request/refresh.
        store.failedNodes.delete(nKey);
        store.checkedNodes.delete(nKey);
        store.nodeRetries.delete(nKey);
      }

      if (store.checkedNodes.has(nKey)) {
        return;
      }
      store.checkedNodes.add(nKey);

      const entry: PendingNodeAuthEntry = { nKey, cKey, cluster, nodeName };
      if (store.allowedByCluster[cKey] === false) {
        store.queue.push(entry);
        pumpQueue();
        return;
      }

      // Cluster-wide check is still in flight or transiently failed; park until it settles.
      const pending = store.pendingByCluster.get(cKey) ?? [];
      pending.push(entry);
      store.pendingByCluster.set(cKey, pending);
    },
    [pumpQueue]
  );

  const runClusterCheck = useCallback(
    (cKey: string, cluster?: string) => {
      const store = storeRef.current!;
      const getAuthorization = K8s?.ResourceClasses?.Node?.getAuthorization;
      if (typeof getAuthorization !== 'function') {
        return;
      }

      Promise.resolve(getAuthorization.call(K8s.ResourceClasses.Node, 'get', {}, cluster))
        .then(res => {
          if (!store.mounted) return;
          store.clusterRetries.delete(cKey);
          store.failedClusters.delete(cKey);
          const allowed = Boolean(res?.status?.allowed);
          const changed = store.allowedByCluster[cKey] !== allowed;
          store.allowedByCluster[cKey] = allowed;

          const waiting = store.pendingByCluster.get(cKey);
          store.pendingByCluster.delete(cKey);

          if (!allowed && waiting && waiting.length > 0) {
            store.queue.push(...waiting);
            pumpQueue();
          }

          if (changed) {
            notify();
          }
        })
        .catch(() => {
          if (!store.mounted) return;
          const attempt = store.clusterRetries.get(cKey) ?? 0;
          if (attempt < MAX_AUTH_RETRY_ATTEMPTS) {
            store.clusterRetries.set(cKey, attempt + 1);
            scheduleRetry(() => {
              runClusterCheck(cKey, cluster);
            }, attempt);
            return;
          }
          // Leave allowedByCluster unset (not falsely cached as RBAC denied) and allow refresh retry.
          store.failedClusters.add(cKey);
        });
    },
    [notify, pumpQueue, scheduleRetry]
  );

  useEffect(() => {
    const store = storeRef.current!;
    store.mounted = true;
    pumpQueue();
    return () => {
      store.mounted = false;
      for (const timer of store.retryTimers) {
        clearTimeout(timer);
      }
      store.retryTimers.clear();
    };
  }, [pumpQueue]);

  // Fast path: check cluster-wide `get` permission on `nodes` once per distinct cluster.
  // Also invalidates exhausted transient failures when `targets` refreshes.
  useEffect(() => {
    const store = storeRef.current!;
    const getAuthorization = K8s?.ResourceClasses?.Node?.getAuthorization;
    if (typeof getAuthorization !== 'function') {
      return;
    }

    for (const [cKey, cluster] of clusterEntries) {
      if (store.failedClusters.has(cKey)) {
        store.failedClusters.delete(cKey);
        store.checkedClusters.delete(cKey);
        store.clusterRetries.delete(cKey);
      }
      if (store.checkedClusters.has(cKey)) {
        continue;
      }
      store.checkedClusters.add(cKey);
      runClusterCheck(cKey, cluster);
    }

    // Retry exhausted named-node failures on targets refresh when cluster check already denied.
    for (const failedKey of Array.from(store.failedNodes)) {
      const separatorIdx = failedKey.indexOf('\0');
      if (separatorIdx === -1) continue;
      const cKey = failedKey.slice(0, separatorIdx);
      const nodeName = failedKey.slice(separatorIdx + 1);
      if (store.allowedByCluster[cKey] === false) {
        const entry = clusterEntries.find(([k]) => k === cKey);
        if (entry) {
          requestNodeAuth(entry[1], nodeName);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targets, clustersSignature, requestNodeAuth, runClusterCheck]);

  // Automatically request authorization for explicitly named targets (e.g., EvaluationDetails).
  useEffect(() => {
    for (const entry of explicitNodeEntries) {
      requestNodeAuth(entry.cluster, entry.nodeName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explicitNodesSignature, requestNodeAuth]);

  const canGetNode = useCallback((cluster?: string, nodeName?: string) => {
    const store = storeRef.current!;
    const cKey = clusterKey(cluster);
    if (store.allowedByCluster[cKey]) {
      return true;
    }
    if (nodeName && store.allowedByNode[nodeKey(cKey, nodeName)]) {
      return true;
    }
    return false;
  }, []);

  return useMemo(
    () => ({ canGetNode, requestNodeAuth, subscribe }),
    [canGetNode, requestNodeAuth, subscribe]
  );
}
