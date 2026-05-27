import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { Box } from '@mui/system';
import { SparkApplicationClass } from '../../resources/sparkApplication';

/**
 * Renders a brief "glance" summary for a SparkApplication on the map.
 *
 * @param props - Component properties.
 * @param props.node - The map node containing the resource.
 */
export function SparkApplicationsGlance({ node }: { node: GraphNode }) {
  const { t } = useTranslation('kubeflow');
  const kubeObject = node?.kubeObject;
  if (!kubeObject || kubeObject.kind !== SparkApplicationClass.kind || !kubeObject.jsonData) {
    return null;
  }

  const app = kubeObject as SparkApplicationClass;
  const status = app.status?.applicationState?.state || 'Unknown';
  const type = app.spec?.type || 'Unknown';

  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="sparkapp-glance">
      <StatusLabel status="">{t('kubeflow|Type: {{type}}', { type })}</StatusLabel>
      <StatusLabel status="">{t('kubeflow|Status: {{status}}', { status })}</StatusLabel>
    </Box>
  );
}
