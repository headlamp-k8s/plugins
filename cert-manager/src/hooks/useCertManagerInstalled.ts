import { Utils } from '@kinvolk/headlamp-plugin/lib';
import { useEffect, useState } from 'react';
import { InstallProbeResult, probeCertManagerInstalled } from '../isCertManagerInstalled';

/**
 * Tracks whether cert-manager is installed on the current cluster.
 *
 * Re-probes when the cluster changes, and ignores a probe that settles after
 * unmount so it cannot write state into a component that has gone away.
 *
 * @returns Flags: isInstalled (API group served), notInstalled (discovery
 *   returned 404), and isLoading (probe in flight). When the probe cannot
 *   complete, all three are false: callers should render their content and let
 *   the real request report the failure.
 */
export function useCertManagerInstalled() {
  const cluster = Utils.getCluster() ?? '';
  const [result, setResult] = useState<InstallProbeResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResult(null);

    probeCertManagerInstalled().then(probed => {
      if (!cancelled) {
        setResult(probed);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [cluster]);

  return {
    isInstalled: result === 'installed',
    notInstalled: result === 'absent',
    isLoading: result === null,
  };
}
