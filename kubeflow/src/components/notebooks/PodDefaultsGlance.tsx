import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { Box } from '@mui/system';
import { PodDefaultClass } from '../../resources/podDefault';

/**
 * Renders a brief "glance" summary for a PodDefault on the map.
 *
 * @param props - Component properties.
 * @param props.node - The map node containing the resource.
 */
export function PodDefaultsGlance({ node }: { node: GraphNode }) {
  const kubeObject = node?.kubeObject;
  if (!kubeObject || kubeObject.kind !== PodDefaultClass.kind || !kubeObject.jsonData) {
    return null;
  }

  const pd = kubeObject as PodDefaultClass;
  const desc = pd.desc;

  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="poddefault-glance">
      {desc && <StatusLabel status="">{desc}</StatusLabel>}
    </Box>
  );
}
