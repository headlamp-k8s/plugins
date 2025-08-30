import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/system';
import { KubeadmControlPlane } from '../../resources/kubeadmcontrolplane';

export function KubeadmControlPlaneGlance({ node }: { node: any }) {
  if (node.kubeObject?.kind === KubeadmControlPlane.kind) {
    const ready = node.kubeObject.status?.readyReplicas || 0;
    const desired = node.kubeObject.spec?.replicas || 0;

    return (
      <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="sets">
        <StatusLabel status="">
          {'Replicas'}: {ready}/{desired}
        </StatusLabel>
      </Box>
    );
  }

  // Return null if the node cannot be rendered by this glance
  return null;
}
