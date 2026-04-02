import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/system';
import { KubeadmControlPlane } from '../../resources/kubeadmcontrolplane';

/**
 * Props for the Glance component.
 * Headlamp's map source provides a GraphNode-like object.
 */
interface GlanceProps {
  /** The node object from Headlamp's map source. */
  node: any;
}

/**
 * Renders a brief "glance" summary for a KubeadmControlPlane on the map.
 * Displays current and desired replica counts.
 *
 * @param props - Component properties.
 * @param props.node - The map node containing the resource.
 */
export function KubeadmControlPlaneGlance({ node }: GlanceProps) {
  if (node.kubeObject?.kind === KubeadmControlPlane.kind) {
    const kcp = node.kubeObject as KubeadmControlPlane;
    const ready = kcp.status?.readyReplicas || 0;
    const desired = kcp.spec?.replicas || 0;

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
