import { ApiProxy, K8s } from '@kinvolk/headlamp-plugin/lib';
import { useEffect, useState } from 'react';
import { getClusterResourceNamespace } from '../utils/clusterResourceNamespace';

export function useClusterResourceNamespace(enabled: boolean) {
  const cluster = K8s.useCluster();
  const [result, setResult] = useState<{ cluster: string; namespace?: string }>();

  useEffect(() => {
    if (!enabled || !cluster) {
      setResult(undefined);
      return;
    }

    let isCurrent = true;

    async function findNamespace() {
      try {
        const deployments = await ApiProxy.clusterRequest('/apis/apps/v1/deployments', {
          method: 'GET',
          cluster,
        });
        if (isCurrent) {
          setResult({ cluster, namespace: getClusterResourceNamespace(deployments) });
        }
      } catch {
        if (isCurrent) {
          setResult(undefined);
        }
      }
    }

    findNamespace();

    return () => {
      isCurrent = false;
    };
  }, [enabled, cluster]);

  return enabled && result?.cluster === cluster ? result.namespace : undefined;
}
