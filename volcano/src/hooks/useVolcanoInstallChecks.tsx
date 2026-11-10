import { useSelectedClusters } from '@kinvolk/headlamp-plugin/lib/k8s';
import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  isVolcanoCoreInstalled as checkVolcanoCoreInstallation,
  isVolcanoFlowInstalled as checkVolcanoFlowInstallation,
  isVolcanoNamespaceQueueInstalled as checkVolcanoNamespaceQueueInstallation,
} from '../volcanoInstallChecks';

export function useVolcanoCoreInstalled() {
  const [isVolcanoCoreInstalled, setIsVolcanoCoreInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkVolcanoCoreInstalled() {
      const isInstalled = await checkVolcanoCoreInstallation();
      setIsVolcanoCoreInstalled(!!isInstalled);
    }
    checkVolcanoCoreInstalled();
  }, []);

  return {
    isVolcanoCoreInstalled,
    isVolcanoCoreCheckLoading: isVolcanoCoreInstalled === null,
  };
}

export function useVolcanoFlowInstalled() {
  const [isVolcanoFlowInstalled, setIsVolcanoFlowInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkVolcanoFlowInstalled() {
      const isInstalled = await checkVolcanoFlowInstallation();
      setIsVolcanoFlowInstalled(!!isInstalled);
    }
    checkVolcanoFlowInstalled();
  }, []);

  return {
    isVolcanoFlowInstalled,
    isVolcanoFlowCheckLoading: isVolcanoFlowInstalled === null,
  };
}

/**
 * Checks whether one cluster serves the NamespaceQueue CRD.
 *
 * @param cluster Cluster to probe. Defaults to the current cluster when omitted.
 * @returns Whether the CRD is served and whether the check is still running.
 */
export function useVolcanoNamespaceQueueInstalled(cluster?: string) {
  const [isVolcanoNamespaceQueueInstalled, setIsVolcanoNamespaceQueueInstalled] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    setIsVolcanoNamespaceQueueInstalled(null);

    checkVolcanoNamespaceQueueInstallation(cluster).then(isInstalled => {
      if (!cancelled) {
        setIsVolcanoNamespaceQueueInstalled(!!isInstalled);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [cluster]);

  return {
    isVolcanoNamespaceQueueInstalled,
    isVolcanoNamespaceQueueCheckLoading: isVolcanoNamespaceQueueInstalled === null,
  };
}

/**
 * Reads the namespaces selected in the Headlamp namespace filter.
 *
 * @returns Selected namespaces, or `undefined` when no namespace filter is set.
 */
export function useSelectedNamespaces(): string[] | undefined {
  const namespaces = useSelector(
    ({ filter }: { filter: { namespaces: Set<string> } }) => filter.namespaces
  );

  return useMemo(() => (namespaces.size === 0 ? undefined : [...namespaces]), [namespaces]);
}

/**
 * Finds which of the selected clusters serve the NamespaceQueue CRD.
 *
 * Each cluster is probed on its own, so a cluster without the CRD does not hide the
 * NamespaceQueues of another selected cluster.
 *
 * @returns Names of the serving clusters and whether the probes are still running.
 */
export function useVolcanoNamespaceQueueClusters() {
  const selectedClusters = useSelectedClusters();
  const currentCluster = getCluster();
  const clusters = selectedClusters?.length
    ? selectedClusters
    : currentCluster
    ? [currentCluster]
    : [];
  const clustersKey = clusters.join('\n');
  const [servingClusters, setServingClusters] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setServingClusters(null);

    Promise.all(
      clustersKey
        .split('\n')
        .filter(Boolean)
        .map(async cluster => ({
          cluster,
          installed: await checkVolcanoNamespaceQueueInstallation(cluster),
        }))
    ).then(results => {
      if (!cancelled) {
        setServingClusters(
          results.filter(result => result.installed).map(result => result.cluster)
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [clustersKey]);

  return { servingClusters, isCheckLoading: servingClusters === null };
}
