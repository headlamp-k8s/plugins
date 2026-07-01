import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';
import React from 'react';

// Check if we're running in Electron
const isElectron = !!(window as any)?.desktopApi;

/**
 * React hook that monitors the active Kubernetes cluster and notifies the
 * Electron main process when the cluster changes. This enables MCP servers
 * to restart with the new cluster context.
 *
 * Polls `getCluster()` every second. When running in Electron, sends a
 * `notifyClusterChange` IPC message on cluster transitions (skipping the
 * initial load).
 *
 * @returns The current cluster name, or null if no cluster is active.
 */
export function useClusterChangeNotifier() {
  const [currentCluster, setCurrentCluster] = React.useState<string | null>(null);
  const previousClusterRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    // Function to check and update cluster
    const checkClusterChange = () => {
      const cluster = getCluster() || null;

      // Update state if cluster changed
      if (cluster !== currentCluster) {
        setCurrentCluster(cluster);
      }
    };

    // Check initially
    checkClusterChange();

    // Set up interval to check for cluster changes
    const interval = setInterval(checkClusterChange, 1000); // Check every second

    return () => clearInterval(interval);
  }, [currentCluster]);

  React.useEffect(() => {
    // Only notify if running in Electron
    if (!isElectron || !(window as any)?.desktopApi?.notifyClusterChange) {
      return;
    }

    const previousCluster = previousClusterRef.current;

    // Only notify if cluster actually changed and it's not the initial load
    if (currentCluster !== previousCluster && previousClusterRef.current !== undefined) {
      // Notify the electron main process
      (window as any).desktopApi.notifyClusterChange(currentCluster);
    }

    // Update the ref for next comparison
    previousClusterRef.current = currentCluster;
  }, [currentCluster]);

  return currentCluster;
}

/**
 * Renderless component that monitors cluster changes and notifies Electron.
 * Include once in the app root to enable automatic MCP server restart on
 * cluster context switches.
 *
 * @returns Always returns null (renders nothing).
 */
export function ClusterChangeNotifier(): null {
  useClusterChangeNotifier();
  return null;
}
