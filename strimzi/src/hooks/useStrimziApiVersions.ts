/**
 * React hook that returns the Strimzi API versions available on the
 * current cluster, triggering a re-render once the probe completes.
 *
 * Components use the returned `kafka` and `core` version strings to build
 * API paths for direct `ApiProxy.request` calls, and `installed` to tell a
 * cluster without Strimzi apart from one that simply has no resources yet.
 * KubeObject classes do not need this: they declare every supported version
 * and Headlamp negotiates the one the cluster serves.
 *
 * @example
 * ```tsx
 * const { kafka: kafkaVersion } = useStrimziApiVersions();
 * await ApiProxy.request(`/apis/kafka.strimzi.io/${kafkaVersion}/kafkatopics`);
 * ```
 */
import React from 'react';
import {
  getStrimziApiVersions,
  resolveStrimziApiVersions,
  type StrimziApiVersions,
} from '../utils/strimziApiVersion';

export function useStrimziApiVersions(): StrimziApiVersions {
  const [versions, setVersions] = React.useState<StrimziApiVersions>(
    getStrimziApiVersions
  );

  React.useEffect(() => {
    let cancelled = false;
    resolveStrimziApiVersions().then(resolved => {
      if (!cancelled) setVersions(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return versions;
}
