import { ApiProxy, Utils } from '@kinvolk/headlamp-plugin/lib';
import { useEffect, useState } from 'react';
import { MONGODB_COMMUNITY_CRD } from '../resources/mongoDBCommunity';

export const CRD_API_VERSION = 'apiextensions.k8s.io/v1';
export const CRD_API_NAME = 'customresourcedefinitions';
export const CRD_PATH = `/apis/${CRD_API_VERSION}/${CRD_API_NAME}/${MONGODB_COMMUNITY_CRD}`;
export const REQUEST_TIMEOUT_MS = 120_000;
export const CHECK_TTL_MS = 30 * 1000;

/**
 * Checks whether an API error indicates a 404 Not Found response.
 *
 * @param error - The caught error object.
 * @returns True if the error status is 404, false otherwise.
 */
export function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('status' in error)) return false;
  const status = (error as { status?: unknown }).status;
  return status === 404 || status === '404';
}

/**
 * Wraps a promise with a timeout, rejecting if it exceeds REQUEST_TIMEOUT_MS.
 *
 * @param request - The promise to await.
 * @param what - Description of the action for timeout error message.
 * @returns The resolved value of the promise.
 */
export function withTimeout<T>(request: Promise<T>, what: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out ${what}`)), REQUEST_TIMEOUT_MS);
    request.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      err => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Cache whether MongoDBCommunity CRD is installed per cluster.
 */
const crdInstalledByCluster: Record<string, boolean | undefined> = {};
const lastCheckedAt: Record<string, number> = {};
const inFlight: Record<string, Promise<boolean> | undefined> = {};

type CacheListener = (cluster: string, isInstalled: boolean) => void;
const cacheListeners = new Set<CacheListener>();

/**
 * Subscribes a listener to CRD detection cache updates.
 *
 * @param listener - Callback invoked when a cluster's CRD cache is populated or changed.
 * @returns An unsubscribe function.
 */
export function subscribeCRDCache(listener: CacheListener): () => void {
  cacheListeners.add(listener);
  return () => {
    cacheListeners.delete(listener);
  };
}

function notifyCacheUpdate(cluster: string, isInstalled: boolean) {
  cacheListeners.forEach(listener => {
    try {
      listener(cluster, isInstalled);
    } catch (e) {
      console.error(e);
    }
  });
}

/**
 * Resets the in-memory CRD detection cache. Useful for unit testing.
 */
export function resetCRDCache() {
  for (const key of Object.keys(crdInstalledByCluster)) {
    delete crdInstalledByCluster[key];
  }
  for (const key of Object.keys(lastCheckedAt)) {
    delete lastCheckedAt[key];
  }
  for (const key of Object.keys(inFlight)) {
    delete inFlight[key];
  }
  cacheListeners.clear();
}

/**
 * Asynchronously checks if the MongoDBCommunity CRD exists on the given cluster.
 * Reads the CRD once with ApiProxy.clusterRequest instead of streaming/watching it,
 * preventing leaked watch sockets and avoiding multiple retries when the CRD is missing.
 * Uses in-flight deduplication and TTL caching to prevent excessive API requests.
 */
export async function checkMongoDBCommunityCRD(cluster: string): Promise<boolean> {
  const now = Date.now();
  const fresh = now - (lastCheckedAt[cluster] ?? 0) < CHECK_TTL_MS;
  if (fresh && crdInstalledByCluster[cluster] !== undefined) {
    return crdInstalledByCluster[cluster]!;
  }

  if (inFlight[cluster]) {
    return inFlight[cluster]!;
  }

  const requestPromise = (async () => {
    try {
      await withTimeout(
        ApiProxy.clusterRequest(CRD_PATH, { cluster }),
        `reading CRD ${MONGODB_COMMUNITY_CRD}`
      );
      crdInstalledByCluster[cluster] = true;
      notifyCacheUpdate(cluster, true);
      return true;
    } catch (err) {
      // Only a confirmed 404 indicates the CRD is genuinely absent from the cluster.
      // Other errors (403, 5xx, network, timeout) do not prove absence (e.g. limited RBAC),
      // so we treat them as installed to prevent locking out authorized users.
      const isInstalled = !isNotFoundError(err);
      crdInstalledByCluster[cluster] = isInstalled;
      notifyCacheUpdate(cluster, isInstalled);
      return isInstalled;
    } finally {
      lastCheckedAt[cluster] = Date.now();
      delete inFlight[cluster];
    }
  })();

  inFlight[cluster] = requestPromise;
  return requestPromise;
}

/**
 * Returns whether MongoDBCommunity CRD is installed on cluster (true, false, or undefined if checking).
 */
export function isMongoDBCommunityInstalled(cluster: string): boolean | undefined {
  return crdInstalledByCluster[cluster];
}

/**
 * React hook to check if MongoDBCommunity CRD is installed on the current cluster.
 * Uses ApiProxy.clusterRequest via checkMongoDBCommunityCRD so that:
 * 1. Missing CRDs return immediately without 5x retries.
 * 2. No background watch stream or socket is kept open.
 * 3. Cluster changes reset installation state to avoid premature mounts or lingering missing-CRD guards.
 * 4. Cache updates and periodic polling unblock the view dynamically when the operator is installed.
 */
export function useMongoDBCommunityInstalled() {
  const cluster = Utils.getCluster() ?? '';
  const [installationState, setInstallationState] = useState<{
    cluster: string;
    isInstalled: boolean | null;
  }>(() => ({
    cluster,
    isInstalled: isMongoDBCommunityInstalled(cluster) ?? null,
  }));

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const result = await checkMongoDBCommunityCRD(cluster);
      if (!cancelled) {
        setInstallationState({ cluster, isInstalled: result });
      }
    }

    check();
    const interval = setInterval(check, CHECK_TTL_MS);

    const unsubscribe = subscribeCRDCache((updatedCluster, isInstalled) => {
      if (!cancelled && updatedCluster === cluster) {
        setInstallationState({ cluster, isInstalled });
      }
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      unsubscribe();
    };
  }, [cluster]);

  const isCurrentCluster = installationState.cluster === cluster;
  const cachedForCurrent = isMongoDBCommunityInstalled(cluster);
  const effectiveInstalled = isCurrentCluster
    ? installationState.isInstalled
    : cachedForCurrent ?? null;

  return {
    isInstalled: effectiveInstalled === true,
    notInstalled: effectiveInstalled === false,
    isLoading: effectiveInstalled === null,
  };
}
