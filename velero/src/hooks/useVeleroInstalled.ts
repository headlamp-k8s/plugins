import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { useCluster } from '@kinvolk/headlamp-plugin/lib/k8s';
import { useEffect, useState } from 'react';

/** True when the API group probe failed because Velero is not registered (HTTP 404). */
function isVeleroApiNotFound(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    (err as { status?: number }).status === 404
  );
}

/**
 * Probes whether Velero is installed by calling GET /apis/velero.io/v1.
 * Returns null for installed while the check is in flight.
 *
 * Only a 404 is treated as "not installed". Other failures (403, 500, network)
 * resolve to installed=true so schedule/backup requests can surface RBAC or
 * load errors in the panel instead of a false "Velero not detected" empty state.
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
      } catch (err) {
        if (!cancelled) {
          setInstalled(!isVeleroApiNotFound(err));
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
