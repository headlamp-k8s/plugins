import { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { Box } from '@mui/system';
import { getCondition } from '../../resources/common';
import { getKCTConditions, KubeadmConfigTemplate } from '../../resources/kubeadmconfigtemplate';
import { renderConditionStatus } from '../common/util';

/**
 * Renders a brief "glance" summary for a KubeadmConfigTemplate on the map.
 * Displays the readiness status of the configuration template.
 *
 * @param props - Component properties.
 * @param props.node - The map node containing the resource.
 */
export function KubeadmConfigTemplateGlance({ node }: { node: GraphNode }) {
  const kubeObject = node?.kubeObject;
  if (!kubeObject || kubeObject.kind !== KubeadmConfigTemplate.kind || !kubeObject.jsonData) {
    return null;
  }

  const kct = kubeObject as KubeadmConfigTemplate;
  const conditions = getKCTConditions(kct.jsonData);
  const readyCondition = getCondition(conditions, 'Ready');

  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="kct-glance">
      {renderConditionStatus(undefined, readyCondition, {
        trueLabel: 'Ready',
        falseLabel: 'Not Ready',
        trueStatus: 'success',
        falseStatus: 'error',
      })}
    </Box>
  );
}
