import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { useCluster } from '@kinvolk/headlamp-plugin/lib/k8s';
import { useEffect, useState } from 'react';

/**
 * Probes whether Velero is installed by calling GET /apis/velero.io/v1.
 * Returns null for installed while the check is in flight.
 */
export function useVeleroInstalled(): { installed: boolean | null; loading: boolean } {
  const cluster = useCluster();
  const [installed, setInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    if (!cluster) {
      setInstalled(null);
      return;
    }

    let cancelled = false;
    setInstalled(null);

    async function probe() {
      try {
        await ApiProxy.request('/apis/velero.io/v1', { method: 'GET' });
        if (!cancelled) {
          setInstalled(true);
        }
      } catch {
        if (!cancelled) {
          setInstalled(false);
        }
      }
    }

    void probe();

    return () => {
      cancelled = true;
    };
  }, [cluster]);

  return { installed, loading: installed === null };
}
