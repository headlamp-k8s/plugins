/**
 * Custom hook to fetch warnings and errors for multiple clusters
 * This replaces the non-existent Event.useWarningList method
 */

import Event from '@kinvolk/headlamp-plugin/lib/K8s/event';
import { useMemo } from 'react';

export interface EventsPerCluster {
  [cluster: string]: {
    warnings: Event[];
    error?: Error | null;
  };
}

export function useClusterWarnings(clusterNames: string[]): EventsPerCluster {
  // Get events for all clusters
  const warningsPerCluster = Event.useWarningList(clusterNames);

  return useMemo(() => {
    const result: EventsPerCluster = {};
    // Initialize result for each cluster
    clusterNames.forEach(clusterName => {
      result[clusterName] = {
        warnings: warningsPerCluster[clusterName]?.warnings ?? [],
        error: warningsPerCluster[clusterName]?.error ?? null
      };
    });

    return result;
  }, [warningsPerCluster]);
}
