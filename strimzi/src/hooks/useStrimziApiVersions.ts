/**
 * React hook that returns the Strimzi API versions available on the
 * current cluster, triggering a re-render once the probe completes.
 *
 * Components use the returned `kafka` and `core` version strings to
 * select the right KubeObject class and to build API paths for direct
 * `ApiProxy.request` calls.
 *
 * @example
 * ```tsx
 * const { kafka: kafkaVersion } = useStrimziApiVersions();
 * const KafkaClass = kafkaVersion === 'v1' ? KafkaV1 : Kafka;
 * return <ResourceListView resourceClass={KafkaClass} ... />;
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
