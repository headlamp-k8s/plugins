import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { Box } from '@mui/system';
import { PipelineClass } from '../../resources/pipeline';

/**
 * Renders a brief "glance" summary for a Pipeline on the map.
 *
 * @param props - Component properties.
 * @param props.node - The map node containing the resource.
 */
export function PipelinesGlance({ node }: { node: GraphNode }) {
  const kubeObject = node?.kubeObject;
  if (!kubeObject || kubeObject.kind !== PipelineClass.kind || !kubeObject.jsonData) {
    return null;
  }

  const pipeline = kubeObject as PipelineClass;
  const desc = pipeline.description;

  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="pipeline-glance">
      {desc && <StatusLabel status="">{desc}</StatusLabel>}
    </Box>
  );
}
