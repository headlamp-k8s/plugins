import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { Box } from '@mui/system';
import { getCondition } from '../../resources/common';
import {
  ClusterApiMachineSet,
  getMachineSetConditions,
  getMachineSetUpToDateReplicas,
  MachineSet,
} from '../../resources/machineset';

/**
 * Renders a brief "glance" summary for a MachineSet on the map.
 * Displays replicas, cluster name, readiness, and provider.
 *
 * @param props - Component properties.
 * @param props.node - The map node containing the resource.
 */
export function MachineSetGlance({ node }: { node: GraphNode }) {
  const { t } = useTranslation();
  if (node.kubeObject?.kind !== MachineSet.kind) {
    return null;
  }

  const ms = node.kubeObject as MachineSet;
  const data = ms.jsonData as ClusterApiMachineSet;
  const spec = data?.spec;
  const status = data?.status;

  const desired = spec?.replicas ?? 1;
  const ready = status?.readyReplicas ?? 0;
  const available = status?.availableReplicas ?? undefined;
  const upToDate = getMachineSetUpToDateReplicas(data) ?? undefined;
  const clusterName: string | undefined = spec?.clusterName;
  const provider = spec?.template?.spec?.infrastructureRef?.kind;

  const conditions = getMachineSetConditions(data);
  const readyCondition = getCondition(conditions, 'Available') ?? getCondition(conditions, 'Ready');
  const isReady = readyCondition?.status === 'True';

  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="ms-glance">
      {clusterName && (
        <StatusLabel status="">{t('Cluster: {{clusterName}}', { clusterName })}</StatusLabel>
      )}
      {provider && <StatusLabel status="">{t('Provider: {{provider}}', { provider })}</StatusLabel>}
      <StatusLabel status="">
        {t('Replicas: {{ready}}/{{desired}}', { ready, desired })}
      </StatusLabel>
      {available !== undefined && (
        <StatusLabel status={available >= desired ? 'success' : 'warning'}>
          {t('Available: {{available}}', { available })}
        </StatusLabel>
      )}
      {upToDate !== undefined && (
        <StatusLabel status={upToDate >= desired ? 'success' : 'warning'}>
          {t('Up-to-date: {{upToDate}}', { upToDate })}
        </StatusLabel>
      )}
      {readyCondition && (
        <StatusLabel status={isReady ? 'success' : 'error'}>
          {isReady ? t('Ready') : t('Not Ready')}
        </StatusLabel>
      )}
    </Box>
  );
}
