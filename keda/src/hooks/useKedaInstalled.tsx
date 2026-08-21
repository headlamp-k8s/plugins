import { Utils } from '@kinvolk/headlamp-plugin/lib';
import { useEffect, useState } from 'react';
import { InstallProbeResult, probeKedaInstalled } from '../isKedaInstalled';

/**
 * Tracks whether KEDA is installed on the current cluster.
 *
 * Re-probes when the cluster changes, and ignores a probe that settles after
 * unmount so it cannot write state into a component that has gone away.
 *
 * @returns notInstalled (discovery returned 404) and isLoading (probe in flight).
 *   There is deliberately no positive flag. When the probe cannot complete both
 *   are false, so callers render their content and let the real request report the
 *   failure. Gating on an isInstalled flag instead would send that case back to the
 *   banner, which is the behaviour this check exists to avoid.
 */
export function useKedaInstalled() {
  const cluster = Utils.getCluster() ?? '';
  const [result, setResult] = useState<InstallProbeResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResult(null);

    probeKedaInstalled().then(probed => {
      if (!cancelled) {
        setResult(probed);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [cluster]);

  return {
    notInstalled: result === 'absent',
    isLoading: result === null,
  };
}
