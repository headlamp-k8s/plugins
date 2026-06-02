import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { Box } from '@mui/system';
import { getCondition } from '../../resources/common';
import {
  ClusterApiMachineDeployment,
  getMachineDeploymentConditions,
  getMachineDeploymentUpToDateReplicas,
  MachineDeployment,
} from '../../resources/machinedeployment';
import { getPhaseStatus } from '../common/util';

/**
 * Renders a brief "glance" summary for a MachineDeployment on the map.
 * Displays replicas, phase, readiness, strategy, and provider.
 *
 * @param props - Component properties.
 * @param props.node - The map node containing the resource.
 */
export function MachineDeploymentGlance({ node }: { node: GraphNode }) {
  const { t } = useTranslation();
  if (node.kubeObject?.kind !== MachineDeployment.kind) {
    // Return null if the node cannot be rendered by this glance
    return null;
  }

  const md = node.kubeObject as MachineDeployment;
  const data = md.jsonData as ClusterApiMachineDeployment;
  const spec = data?.spec;
  const status = data?.status;

  const desired = spec?.replicas ?? 1;
  const ready = status?.readyReplicas ?? 0;
  const available = status?.availableReplicas ?? undefined;
  const upToDate =
    getMachineDeploymentUpToDateReplicas(data) ?? status?.updatedReplicas ?? undefined;
  const phase: string | undefined = status?.phase;
  const paused: boolean = spec?.paused === true;
  const strategy = spec?.strategy?.type || 'RollingUpdate';
  const clusterName = data.metadata?.labels?.['cluster.x-k8s.io/cluster-name'];
  const provider = spec?.template?.spec?.infrastructureRef?.kind;

  const conditions = getMachineDeploymentConditions(data);
  const readyCondition = getCondition(conditions, 'Available') ?? getCondition(conditions, 'Ready');
  const isReady = readyCondition?.status === 'True';

  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="md-glance">
      {clusterName && (
        <StatusLabel status="">{t('Cluster: {{clusterName}}', { clusterName })}</StatusLabel>
      )}
      {provider && <StatusLabel status="">{t('Provider: {{provider}}', { provider })}</StatusLabel>}
      <StatusLabel status="">{t('Strategy: {{strategy}}', { strategy })}</StatusLabel>
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
      {phase && (
        <StatusLabel status={getPhaseStatus(phase)}>{t('Phase: {{phase}}', { phase })}</StatusLabel>
      )}
      {readyCondition && (
        <StatusLabel status={isReady ? 'success' : 'error'}>
          {isReady ? t('Ready') : t('Not Ready')}
        </StatusLabel>
      )}
      {paused && <StatusLabel status="warning">{t('Paused')}</StatusLabel>}
    </Box>
  );
}
