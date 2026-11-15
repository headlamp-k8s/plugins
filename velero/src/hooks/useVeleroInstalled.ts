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

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

/**
 * Probes whether Velero is installed by calling GET /apis/velero.io/v1.
 * Returns null for installed while the check is in flight.
 *
 * Only a 404 is treated as "not installed". Other failures (403, 500, network)
 * are retained as `error` so callers can show an access/load failure instead of
 * a false "Velero not detected" empty state.
 */
export function useVeleroInstalled(): {
  installed: boolean | null;
  loading: boolean;
  error: Error | null;
} {
  const cluster = useCluster();
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!cluster) {
      setInstalled(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setInstalled(null);
    setError(null);

    async function probe() {
      try {
        await ApiProxy.request('/apis/velero.io/v1', { method: 'GET' });
        if (!cancelled) {
          setInstalled(true);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          if (isVeleroApiNotFound(err)) {
            setInstalled(false);
            setError(null);
          } else {
            // Not a confirmed missing install — keep installed unset and surface the error.
            setInstalled(null);
            setError(toError(err));
          }
        }
      }
    }

    void probe();

    return () => {
      cancelled = true;
    };
  }, [cluster]);

  return {
    installed,
    loading: installed === null && error === null,
    error,
  };
}
