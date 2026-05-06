import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { Box } from '@mui/system';
import { getCondition } from '../../resources/common';
import { getMachineConditions, getMachineStatus, Machine } from '../../resources/machine';
import { getPhaseStatus } from '../common/util';

/**
 * Renders a brief "glance" summary for a Machine on the map.
 * Displays phase, cluster, readiness (Unknown until Ready condition is reported), versions, IPs, and provider info.
 *
 * @param props - Component properties.
 * @param props.node - The map node containing the resource.
 */
export function MachineGlance({ node }: { node: GraphNode }) {
  const kubeObject = node?.kubeObject;
  if (!kubeObject || kubeObject.kind !== Machine.kind || !kubeObject.jsonData) {
    return null;
  }

  const data = kubeObject.jsonData;
  const spec = data.spec ?? {};
  const status = getMachineStatus(data);
  if (!status) {
    return null;
  }

  const conditions = getMachineConditions(data);
  const clusterName =
    spec.clusterName || data.metadata?.labels?.['cluster.x-k8s.io/cluster-name'] || 'Unknown';
  const version: string | undefined = spec.version;

  const readyCondition = getCondition(conditions, 'Ready');

  const internalIP = status.addresses?.find(addr => addr.type === 'InternalIP')?.address || null;
  const externalIP = status.addresses?.find(addr => addr.type === 'ExternalIP')?.address || null;

  const nodeRef = status.nodeRef?.name;
  const osImage = status.nodeInfo?.osImage;
  const infraRef = spec.infrastructureRef;
  const provider = infraRef?.kind;
  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="machine-glance">
      <StatusLabel status="">{`Cluster: ${clusterName}`}</StatusLabel>
      <StatusLabel status={getPhaseStatus(status?.phase ?? '')}>
        {`${status?.phase ?? 'Unknown'}`}
      </StatusLabel>
      {!readyCondition || readyCondition.status === 'Unknown' ? (
        <StatusLabel status="warning">Unknown</StatusLabel>
      ) : (
        <StatusLabel status={readyCondition.status === 'True' ? 'success' : 'error'}>
          {readyCondition.status === 'True' ? 'Ready' : 'Not Ready'}
        </StatusLabel>
      )}
      {version && <StatusLabel status="">{`k8s: ${version}`}</StatusLabel>}
      {provider && <StatusLabel status="">{`Provider: ${provider}`}</StatusLabel>}
      {osImage && <StatusLabel status="">{`OS: ${osImage}`}</StatusLabel>}
      {nodeRef && <StatusLabel status="">{`Node: ${nodeRef}`}</StatusLabel>}
      {internalIP && <StatusLabel status="">{`Internal IP: ${internalIP}`}</StatusLabel>}
      {externalIP && <StatusLabel status="">{`External IP: ${externalIP}`}</StatusLabel>}
    </Box>
  );
}
