import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { Box } from '@mui/system';
import {
  ClusterApiMachineHealthCheck,
  MachineHealthCheck,
} from '../../resources/machinehealthcheck';

/**
 * Renders a brief "glance" summary for a MachineHealthCheck on the map.
 * Displays target cluster, healthy machines count, and health thresholds.
 *
 * @param props - Component properties.
 * @param props.node - The map node containing the resource.
 */
export function MachineHealthCheckGlance({ node }: { node: GraphNode }) {
  const kubeObject = node?.kubeObject;
  if (!kubeObject || kubeObject.kind !== MachineHealthCheck.kind || !kubeObject.jsonData) {
    return null;
  }

  const mhc = kubeObject as MachineHealthCheck;
  const data = mhc.jsonData as ClusterApiMachineHealthCheck;
  const spec = data?.spec;
  const status = data?.status;

  const clusterName = spec?.clusterName || 'Unknown';
  const expected = status?.expectedMachines;
  const healthy = status?.currentHealthy;
  const hasHealthCounts = typeof expected === 'number' && typeof healthy === 'number';

  const maxUnhealthy = spec?.maxUnhealthy ?? '100%';
  const nodeStartupTimeout =
    spec?.nodeStartupTimeout || spec?.checks?.nodeStartupTimeoutSeconds || 'Unknown';

  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="mhc-glance">
      <StatusLabel status="">{`Cluster: ${clusterName}`}</StatusLabel>
      <StatusLabel
        status={hasHealthCounts ? (healthy >= expected ? 'success' : 'error') : 'warning'}
      >
        {hasHealthCounts ? `Healthy: ${healthy}/${expected}` : 'Healthy: unknown'}
      </StatusLabel>
      <StatusLabel status="">{`Max Unhealthy: ${maxUnhealthy}`}</StatusLabel>
      <StatusLabel status="">{`Timeout: ${nodeStartupTimeout}`}</StatusLabel>
    </Box>
  );
}
