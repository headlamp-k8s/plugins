import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { Box } from '@mui/system';
import { KatibExperimentClass } from '../../resources/katibExperiment';

/**
 * Renders a brief "glance" summary for a KatibExperiment on the map.
 *
 * @param props - Component properties.
 * @param props.node - The map node containing the resource.
 */
export function KatibExperimentsGlance({ node }: { node: GraphNode }) {
  const { t } = useTranslation('kubeflow');
  const kubeObject = node?.kubeObject;
  if (!kubeObject || kubeObject.kind !== KatibExperimentClass.kind || !kubeObject.jsonData) {
    return null;
  }

  const exp = kubeObject as KatibExperimentClass;
  const status = exp.status?.conditions?.[exp.status.conditions.length - 1]?.type || 'Unknown';

  return (
    <Box
      display="flex"
      gap={1}
      alignItems="center"
      mt={2}
      flexWrap="wrap"
      key="katibexperiment-glance"
    >
      <StatusLabel status="">{t('kubeflow|Status: {{status}}', { status })}</StatusLabel>
    </Box>
  );
}
