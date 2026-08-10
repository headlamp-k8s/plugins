/**
 * EventFetcher – one-shot Kubernetes Event retrieval.
 *
 * Replaces the continuous `Event.useWarningList` React hook with a direct
 * `clusterRequest` call so events are only fetched when we actually need them
 * (e.g. at the start of a proactive-diagnosis cycle).
 */

import { clusterRequest } from '@kinvolk/headlamp-plugin/lib/ApiProxy';

/** Raw Kubernetes Event object as returned by the API server. */
export interface RawK8sEvent {
  /** Standard Kubernetes object metadata. */
  metadata: { uid: string; name: string; namespace: string; creationTimestamp: string };
  /** Event severity type, e.g. "Normal", "Warning", or "Error". */
  type: string;
  /** Short machine-readable reason for the event. */
  reason: string;
  /** Human-readable description of the event. */
  message: string;
  /** Reference to the Kubernetes object this event is about. */
  involvedObject: { kind: string; name: string; namespace: string };
  /** Timestamp of the last occurrence of this event. */
  lastTimestamp?: string;
  /** Additional fields from the Kubernetes Event resource. */
  [key: string]: any;
}

/** Timestamp of the last failure per cluster, used to back off from unreachable clusters. */
const lastFailureByCluster = new Map<string, number>();

/** How long an unreachable cluster is skipped before it is retried. */
const FAILURE_BACKOFF_MS = 5 * 60 * 1000;

/** How long a cluster's events are reused instead of issuing another request. */
const EVENTS_CACHE_MS = 30 * 1000;

/** Most recent successful result per cluster. */
const eventsByCluster = new Map<string, { events: RawK8sEvent[]; fetchedAt: number }>();

/** Requests currently in flight, so concurrent callers share one request per cluster. */
const inFlightByCluster = new Map<string, Promise<RawK8sEvent[]>>();

/**
 * Fetch Warning / Error events from a single cluster via the Kubernetes API.
 * Uses `fieldSelector=type!=Normal` so only warning & error events are returned.
 *
 * Context is refreshed on nearly every Headlamp event, so results are cached,
 * concurrent callers share one request, and failing clusters are skipped for a
 * cooldown period. Without this the renderer exhausts its connection pool.
 */
export async function fetchWarningEventsForCluster(cluster: string): Promise<RawK8sEvent[]> {
  const cached = eventsByCluster.get(cluster);
  if (cached && Date.now() - cached.fetchedAt < EVENTS_CACHE_MS) {
    return cached.events;
  }

  const pending = inFlightByCluster.get(cluster);
  if (pending) return pending;

  const request = requestWarningEvents(cluster).finally(() => inFlightByCluster.delete(cluster));
  inFlightByCluster.set(cluster, request);
  return request;
}

/**
 * Performs the uncached event request for one cluster.
 *
 * @param cluster - Cluster to query.
 * @returns Warning events, or an empty list when the cluster cannot be reached.
 */
async function requestWarningEvents(cluster: string): Promise<RawK8sEvent[]> {
  const lastFailure = lastFailureByCluster.get(cluster);
  if (lastFailure !== undefined && Date.now() - lastFailure < FAILURE_BACKOFF_MS) {
    return [];
  }

  try {
    const response: any = await clusterRequest(
      '/api/v1/events?fieldSelector=type!=Normal&limit=50',
      { cluster }
    );

    lastFailureByCluster.delete(cluster);
    const items: RawK8sEvent[] = response?.items ?? [];
    eventsByCluster.set(cluster, { events: items, fetchedAt: Date.now() });
    return items;
  } catch (err) {
    // Only report the first failure so an unreachable cluster cannot flood the console.
    if (lastFailure === undefined) {
      console.warn(`[EventFetcher] Cluster ${cluster} is unreachable, skipping its events:`, err);
    }
    lastFailureByCluster.set(cluster, Date.now());
    return [];
  }
}

/**
 * Fetch Warning / Error events across multiple clusters.
 * Returns a flat array of raw event objects (each enriched with a `_cluster`
 * property for downstream consumption).
 */
export async function fetchWarningEventsForClusters(clusterNames: string[]): Promise<any[]> {
  if (!clusterNames || clusterNames.length === 0) return [];

  const results = await Promise.all(
    clusterNames.map(async cluster => {
      const events = await fetchWarningEventsForCluster(cluster);
      // Wrap in the shape that ProactiveDiagnosisManager.extractTopEvents expects
      return events.map(e => ({ jsonData: e, _cluster: cluster }));
    })
  );
  return results.flat();
}

/**
 * Fetch warnings grouped by cluster, matching the shape expected by
 * `generateContextDescription`.
 */
export async function fetchClusterWarnings(
  clusterNames: string[]
): Promise<Record<string, { warnings: any[]; error?: Error | null }>> {
  const result: Record<string, { warnings: any[]; error?: Error | null }> = {};

  await Promise.all(
    clusterNames.map(async cluster => {
      try {
        const events = await fetchWarningEventsForCluster(cluster);
        // Wrap each event to look like what the context generator expects
        result[cluster] = { warnings: events.map(e => ({ jsonData: e })) as any[], error: null };
      } catch (err: any) {
        result[cluster] = { warnings: [], error: err };
      }
    })
  );
  return result;
}
