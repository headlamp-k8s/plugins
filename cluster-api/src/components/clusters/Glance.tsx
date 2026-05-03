import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { Box } from '@mui/system';
import {
  getClusterConditions,
  getClusterControlPlaneStatus,
  getClusterInitialization,
  getClusterWorkerStatus,
} from '../../resources/cluster';
import { Cluster } from '../../resources/cluster';
import { getCondition } from '../../resources/common';
import { getPhaseStatus } from '../common/util';

/**
 * Renders a brief "glance" summary for a Cluster on the map.
 * Displays phase, provider, Kubernetes version, endpoint, init/provision flags, replica counts, and Ready condition.
 *
 * @param props - Component properties.
 * @param props.node - The map node containing the resource.
 */
export function ClusterGlance({ node }: { node: GraphNode }) {
  if (node.kubeObject?.kind !== Cluster.kind) {
    return null;
  }

  const data = node.kubeObject.jsonData;
  const spec = data?.spec ?? {};
  const status = data?.status ?? {};

  const infraRef = spec.infrastructureRef;
  const providerName = infraRef?.kind;

  const phase: string = status.phase || 'Unknown';

  const cpEndpoint = spec.controlPlaneEndpoint;
  const endpointStr = cpEndpoint?.host ? `${cpEndpoint.host}:${cpEndpoint.port ?? 6443}` : null;

  const initialization = getClusterInitialization(data);
  const infraProvisioned = initialization?.infrastructureProvisioned;
  const cpInitialized = initialization?.controlPlaneInitialized;
  const paused: boolean = spec.paused === true;

  const cpStatus = getClusterControlPlaneStatus(data);
  const workerStatus = getClusterWorkerStatus(data);

  const conditions = getClusterConditions(data);
  const readyCondition = getCondition(conditions, 'Ready');
  const isReady = readyCondition?.status === 'True';

  const k8sVersion = spec.topology?.version ?? null;
  const clusterClassName = spec?.topology?.class ?? spec?.topology?.classRef?.name;

  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="cluster-glance">
      {clusterClassName && <StatusLabel status="">{`Class: ${clusterClassName}`}</StatusLabel>}
      {k8sVersion && <StatusLabel status="">{`${k8sVersion}`}</StatusLabel>}
      <StatusLabel status={getPhaseStatus(phase)}>{`${phase}`}</StatusLabel>
      {providerName && <StatusLabel status="">{`Provider: ${providerName}`}</StatusLabel>}
      {endpointStr && <StatusLabel status="">{`Endpoint: ${endpointStr}`}</StatusLabel>}
      {infraProvisioned !== undefined && (
        <StatusLabel status={infraProvisioned ? 'success' : 'warning'}>
          {infraProvisioned ? 'Infra: Provisioned' : 'Infra: Not Provisioned'}
        </StatusLabel>
      )}
      {cpInitialized !== undefined && (
        <StatusLabel status={cpInitialized ? 'success' : 'warning'}>
          {cpInitialized ? 'CP: Initialized' : 'CP: Not Initialized'}
        </StatusLabel>
      )}
      {cpStatus && (
        <StatusLabel
          status={cpStatus.readyReplicas === cpStatus.desiredReplicas ? 'success' : 'warning'}
        >
          {`CPs: ${cpStatus.readyReplicas ?? 0} / ${
            cpStatus.desiredReplicas ?? cpStatus.replicas ?? '?'
          }`}
        </StatusLabel>
      )}
      {workerStatus && (
        <StatusLabel
          status={
            workerStatus.readyReplicas === workerStatus.desiredReplicas ? 'success' : 'warning'
          }
        >
          {`Workers: ${workerStatus.readyReplicas ?? 0}/${
            workerStatus.desiredReplicas ?? workerStatus.replicas ?? '?'
          }`}
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
