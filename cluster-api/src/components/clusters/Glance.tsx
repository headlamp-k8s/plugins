import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/system';
import { Cluster } from '../../resources/cluster';

export function ClusterGlance({ node }: { node: any }) {
  if (node.kubeObject?.kind === Cluster.kind) {
    const phase = node.kubeObject.status?.phase || 'Unknown';
    const controlPlaneReady = node.kubeObject.status?.controlPlaneReady;
    const infraReady = node.kubeObject.status?.infrastructureReady;

    return (
      <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="cluster">
        <StatusLabel status={phase === 'Provisioned' ? 'success' : ''}>
          {phase}
        </StatusLabel>
        <StatusLabel status={controlPlaneReady ? 'success' : 'error'}>
          CP: {controlPlaneReady ? 'Ready' : 'Not Ready'}
        </StatusLabel>
        <StatusLabel status={infraReady ? 'success' : 'error'}>
          Infra: {infraReady ? 'Ready' : 'Not Ready'}
        </StatusLabel>
      </Box>
    );
  }

  return null;
}
