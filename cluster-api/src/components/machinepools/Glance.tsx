import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { Box } from '@mui/system';
import { getCondition } from '../../resources/common';
import {
  ClusterApiMachinePool,
  getMachinePoolConditions,
  getMachinePoolUpToDateReplicas,
  MachinePool,
} from '../../resources/machinepool';
import { getPhaseStatus } from '../common/util';

/**
 * Renders a brief "glance" summary for a MachinePool on the map.
 * Displays replica counts, phase, cluster name, and readiness.
 *
 * @param props - Component properties.
 * @param props.node - The map node containing the resource.
 */
export function MachinePoolGlance({ node }: { node: GraphNode }) {
  const { t } = useTranslation();
  if (node.kubeObject?.kind !== MachinePool.kind) {
    // Return null if the node cannot be rendered by this glance
    return null;
  }

  const mp = node.kubeObject as MachinePool;
  const data = mp.jsonData as ClusterApiMachinePool;
  const spec = data?.spec;
  const status = data?.status;

  const desired = spec?.replicas ?? 1;
  const ready = status?.readyReplicas ?? 0;
  const available = status?.availableReplicas ?? undefined;
  const upToDate = getMachinePoolUpToDateReplicas(data) ?? undefined;
  const phase: string | undefined = status?.phase;
  const clusterName: string | undefined = spec?.clusterName;
  const provider = spec?.template?.spec?.infrastructureRef?.kind || 'Unknown';

  const conditions = getMachinePoolConditions(data);
  const readyCondition = getCondition(conditions, 'Available') ?? getCondition(conditions, 'Ready');
  const isReady = readyCondition?.status === 'True';

  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="mp-glance">
      {clusterName && (
        <StatusLabel status="">{t('Cluster: {{clusterName}}', { clusterName })}</StatusLabel>
      )}
      {phase && <StatusLabel status={getPhaseStatus(phase)}>{`${phase}`}</StatusLabel>}
      <StatusLabel status="">{t('Provider: {{provider}}', { provider })}</StatusLabel>
      <StatusLabel status={phase ? getPhaseStatus(phase) : ''}>
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
