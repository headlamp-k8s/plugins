import { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { Box } from '@mui/system';
import { getCondition } from '../../resources/common';
import { getKCConditions, KubeadmConfig } from '../../resources/kubeadmconfig';
import { renderConditionStatus } from '../common/util';

/**
 * Renders a brief "glance" summary for a KubeadmConfig on the map.
 * Displays the readiness status of the configuration.
 * Missing Ready condition and unset status.ready are shown as Unknown (same as list/detail), not Not Ready.
 *
 * @param props - Component properties.
 * @param props.node - The map node containing the resource.
 */
export function KubeadmConfigGlance({ node }: { node: GraphNode }) {
  const kubeObject = node?.kubeObject;
  if (!kubeObject || kubeObject.kind !== KubeadmConfig.kind || !kubeObject.jsonData) {
    return null;
  }

  const kc = kubeObject as KubeadmConfig;
  const readyBool = kc.status?.ready;
  const conditions = getKCConditions(kc.jsonData);
  const readyCondition = getCondition(conditions, 'Ready');
  const readyValue = typeof readyBool === 'boolean' ? (readyBool ? 'true' : 'false') : undefined;

  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="kc-glance">
      {renderConditionStatus(readyValue, readyCondition, {
        trueLabel: 'Ready',
        falseLabel: 'Not Ready',
        trueStatus: 'success',
        falseStatus: 'error',
      })}
    </Box>
  );
}
