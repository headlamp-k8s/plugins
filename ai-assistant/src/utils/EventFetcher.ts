/**
 * EventFetcher – one-shot Kubernetes Event retrieval.
 *
 * Replaces the continuous `Event.useWarningList` React hook with a direct
 * `clusterRequest` call so events are only fetched when we actually need them
 * (e.g. at the start of a proactive-diagnosis cycle).
 */

import { clusterRequest } from '@kinvolk/headlamp-plugin/lib/ApiProxy';

export interface RawK8sEvent {
  metadata: { uid: string; name: string; namespace: string; creationTimestamp: string };
  type: string; // "Normal" | "Warning" | "Error"
  reason: string;
  message: string;
  involvedObject: { kind: string; name: string; namespace: string };
  lastTimestamp?: string;
  [key: string]: any;
}

/**
 * Fetch Warning / Error events from a single cluster via the Kubernetes API.
 * Uses `fieldSelector=type!=Normal` so only warning & error events are returned.
 */
export async function fetchWarningEventsForCluster(cluster: string): Promise<RawK8sEvent[]> {
  try {
    const response: any = await clusterRequest(
      '/api/v1/events?fieldSelector=type!=Normal&limit=50',
      { cluster }
    );

    const items: RawK8sEvent[] = response?.items ?? [];
    return items;
  } catch (err) {
    console.error(`[EventFetcher] Failed to fetch events for cluster ${cluster}:`, err);
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
  console.log(results);
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
  console.log(result);
  return result;
}
