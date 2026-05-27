import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { Box } from '@mui/system';
import { TrainJobClass } from '../../resources/trainJob';
import { formatPercent } from '../training/trainerUtils';
import { TrainJobStatusBadge } from '../training/TrainJobStatusBadge';

/**
 * Renders a brief "glance" summary for a TrainJob on the map.
 *
 * @param props - Component properties.
 * @param props.node - The map node containing the resource.
 */
export function TrainJobsGlance({ node }: { node: GraphNode }) {
  const { t } = useTranslation('kubeflow');
  const kubeObject = node?.kubeObject;
  if (!kubeObject || kubeObject.kind !== TrainJobClass.kind || !kubeObject.jsonData) {
    return null;
  }

  const job = kubeObject as TrainJobClass;

  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="trainjob-glance">
      <TrainJobStatusBadge job={job} />
      {job.progress !== undefined && (
        <StatusLabel status="">
          {t('kubeflow|Progress: {{val}}', { val: formatPercent(job.progress) })}
        </StatusLabel>
      )}
      <StatusLabel status="">
        {t('kubeflow|Nodes: {{val}}', { val: job.numNodes ?? '-' })}
      </StatusLabel>
    </Box>
  );
}
