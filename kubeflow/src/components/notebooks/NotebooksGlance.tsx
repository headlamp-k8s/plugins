import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { Box } from '@mui/system';
import { NotebookClass } from '../../resources/notebook';
import { NotebookStatusBadge } from '../common/NotebookStatusBadge';
import { NotebookTypeBadge } from '../common/NotebookTypeBadge';

/**
 * Renders a brief "glance" summary for a Notebook on the map.
 *
 * @param props - Component properties.
 * @param props.node - The map node containing the resource.
 */
export function NotebooksGlance({ node }: { node: GraphNode }) {
  const { t } = useTranslation('kubeflow');
  const kubeObject = node?.kubeObject;
  if (!kubeObject || kubeObject.kind !== NotebookClass.kind || !kubeObject.jsonData) {
    return null;
  }

  const nb = kubeObject as NotebookClass;
  const image = nb.containerImage;

  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="notebook-glance">
      <NotebookStatusBadge jsonData={nb.jsonData} />
      {image && (
        <StatusLabel status="">
          <NotebookTypeBadge image={image} />
        </StatusLabel>
      )}
      <StatusLabel status="">
        {t('kubeflow|Ready: {{ready}}/{{total}}', { ready: nb.readyReplicas, total: 1 })}
      </StatusLabel>
    </Box>
  );
}
