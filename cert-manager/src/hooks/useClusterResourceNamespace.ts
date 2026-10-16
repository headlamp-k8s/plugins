import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { useEffect, useState } from 'react';
import { getClusterResourceNamespace } from '../utils/clusterResourceNamespace';

export function useClusterResourceNamespace(enabled: boolean) {
  const [namespace, setNamespace] = useState<string | undefined>();

  useEffect(() => {
    if (!enabled) {
      setNamespace(undefined);
      return;
    }

    let isCurrent = true;

    async function findNamespace() {
      try {
        const deployments = await ApiProxy.request('/apis/apps/v1/deployments', { method: 'GET' });
        if (isCurrent) {
          setNamespace(getClusterResourceNamespace(deployments));
        }
      } catch {
        if (isCurrent) {
          setNamespace(undefined);
        }
      }
    }

    findNamespace();

    return () => {
      isCurrent = false;
    };
  }, [enabled]);

  return namespace;
}
