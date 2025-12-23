import { useEffect, useState } from 'react';
import { isKnativeInstalled } from '../isKnativeInstalled';

export function useKnativeInstalled(clusters: string[]) {
  const clustersKey = clusters.join(',');

  const [isKnativeInstalledState, setIsKnativeInstalledState] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkKnativeInstalled() {
      setIsKnativeInstalledState(null);
      const installed = await isKnativeInstalled(clusters);
      if (cancelled) {
        return;
      }
      setIsKnativeInstalledState(installed);
    }

    checkKnativeInstalled();

    return () => {
      cancelled = true;
    };
  }, [clustersKey]);

  return {
    isKnativeInstalled: isKnativeInstalledState,
    isKnativeCheckLoading: isKnativeInstalledState === null,
  };
}
