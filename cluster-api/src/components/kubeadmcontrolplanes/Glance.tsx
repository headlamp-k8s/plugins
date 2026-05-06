import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { Box } from '@mui/system';
import { getCondition } from '../../resources/common';
import { getKCPConditions, KubeadmControlPlane } from '../../resources/kubeadmcontrolplane';
import { getPhaseStatus } from '../common/util';

/**
 * Renders a brief "glance" summary for a KubeadmControlPlane on the map.
 * Displays replicas, version, readiness, strategy, and provider.
 *
 * @param props - Component properties.
 * @param props.node - The map node containing the resource.
 */
export function KubeadmControlPlaneGlance({ node }: { node: GraphNode }) {
  if (node.kubeObject?.kind !== KubeadmControlPlane.kind) {
    return null;
  }

  const kcp = node.kubeObject as KubeadmControlPlane;
  const data = kcp.jsonData;
  const spec = data?.spec ?? {};
  const status = data?.status ?? {};

  const desired = spec.replicas ?? 1;
  const ready = status.readyReplicas ?? 0;
  // Try v1beta2 nested or direct
  const available = status.v1beta2?.availableReplicas ?? status.availableReplicas ?? undefined;
  const upToDate =
    status.v1beta2?.upToDateReplicas ??
    status.updatedReplicas ??
    status.upToDateReplicas ??
    undefined;

  const version = spec.version ?? null;
  const initialized: boolean | undefined =
    status.initialized ?? status.initialization?.controlPlaneInitialized;
  const paused = spec.paused === true;
  const observedGeneration = status.observedGeneration;
  const strategy = spec.rolloutStrategy?.type ?? spec.strategy?.type ?? 'RollingUpdate';
  const clustername = data.metadata?.labels?.['cluster.x-k8s.io/cluster-name'];

  // Extract provider from machineTemplate infrastructureRef
  const infraRef =
    spec.machineTemplate?.infrastructureRef ||
    (spec.machineTemplate?.spec as any)?.infrastructureRef;
  const provider = infraRef?.kind;

  const conditions = getKCPConditions(data);
  const readyCondition = getCondition(conditions, 'Ready');
  const isReady = readyCondition?.status === 'True';

  // Derive a phase-like label from replica state
  const phaseLabel =
    ready === desired && ready > 0 ? 'Running' : ready < desired ? 'Provisioning' : 'Unknown';

  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="kcp-glance">
      {clustername && <StatusLabel status="">{`Cluster: ${clustername}`}</StatusLabel>}
      {version && <StatusLabel status="">{`${version}`}</StatusLabel>}

      {provider && <StatusLabel status="">{`Provider: ${provider}`}</StatusLabel>}
      <StatusLabel status="">{`Strategy: ${strategy}`}</StatusLabel>
      {observedGeneration !== undefined && (
        <StatusLabel status="">{`Gen: ${observedGeneration}`}</StatusLabel>
      )}
      {initialized !== undefined && (
        <StatusLabel status={initialized ? 'success' : 'warning'}>
          {initialized ? 'Initialized' : 'Not Initialized'}
        </StatusLabel>
      )}
      <StatusLabel status={getPhaseStatus(phaseLabel)}>
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

      {readyCondition && (
        <StatusLabel status={isReady ? 'success' : 'error'}>
          {isReady ? 'Ready' : 'Not Ready'}
        </StatusLabel>
      )}
      {paused && <StatusLabel status="warning">Paused</StatusLabel>}
    </Box>
  );
}
