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
  const readyCondition = getCondition(conditions, 'Ready');
  const isReady = readyCondition?.status === 'True';

  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="md-glance">
      {clusterName && <StatusLabel status="">{`Cluster: ${clusterName}`}</StatusLabel>}
      {provider && <StatusLabel status="">{`Provider: ${provider}`}</StatusLabel>}
      <StatusLabel status="">{`Strategy: ${strategy}`}</StatusLabel>
      <StatusLabel status={phase ? getPhaseStatus(phase) : ''}>
        {`Replicas: ${ready}/${desired}`}
      </StatusLabel>
      {available !== undefined && (
        <StatusLabel status={available >= desired ? 'success' : 'warning'}>
          {`Available: ${available}`}
        </StatusLabel>
      )}
      {upToDate !== undefined && (
        <StatusLabel status={upToDate >= desired ? 'success' : 'warning'}>
          {`Up-to-date: ${upToDate}`}
        </StatusLabel>
      )}
      {phase && <StatusLabel status={getPhaseStatus(phase)}>{`Phase: ${phase}`}</StatusLabel>}
      {readyCondition && (
        <StatusLabel status={isReady ? 'success' : 'error'}>
          {isReady ? 'Ready' : 'Not Ready'}
        </StatusLabel>
      )}
      {paused && <StatusLabel status="warning">Paused</StatusLabel>}
    </Box>
  );
}
