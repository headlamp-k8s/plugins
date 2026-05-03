import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { Box } from '@mui/system';
import { ClusterApiMachineDrainRule, MachineDrainRule } from '../../resources/machinedrainrule';

/**
 * Renders a brief "glance" summary for a MachineDrainRule on the map.
 * Displays the drain behavior and execution order.
 *
 * @param props - Component properties.
 * @param props.node - The map node containing the resource.
 */
export function MachineDrainRuleGlance({ node }: { node: GraphNode }) {
  const kubeObject = node?.kubeObject;
  if (!kubeObject || kubeObject.kind !== MachineDrainRule.kind || !kubeObject.jsonData) {
    return null;
  }

  const mdr = kubeObject as MachineDrainRule;
  const data = mdr.jsonData as ClusterApiMachineDrainRule;
  const spec = data?.spec;

  const behavior = spec?.drain?.behavior || 'Unknown';
  const order = spec?.drain?.order !== undefined ? spec?.drain?.order.toString() : 'None';

  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="mdr-glance">
      <StatusLabel status="">{`Behavior: ${behavior}`}</StatusLabel>
      <StatusLabel status="">{`Order: ${order}`}</StatusLabel>
    </Box>
  );
}
