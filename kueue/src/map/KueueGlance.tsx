import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import type { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { Box } from '@mui/system';
import { ClusterQueue } from '../resources/clusterQueue';
import { LocalQueue } from '../resources/localQueue';
import { Workload } from '../resources/workload';

/** Short facts shown when hovering a Kueue node on the Map. */
export function getKueueGlanceLabels(object: unknown): string[] | null {
  if (object instanceof Workload) {
    const labels = [`Status: ${object.statusDisplay}`];
    if (object.blockerStageDisplay !== '-') {
      labels.push(`Blocked on: ${object.blockerStageDisplay}`);
    }
    labels.push(`Queue: ${object.queueNameDisplay}`);
    return labels;
  }

  if (object instanceof LocalQueue || object instanceof ClusterQueue) {
    return [
      `Status: ${object.statusDisplay}`,
      `Pending: ${object.pendingWorkloads}`,
      `Admitted: ${object.admittedWorkloads}`,
    ];
  }

  return null;
}

/** Glance for Workload, LocalQueue and ClusterQueue nodes. Other nodes get nothing. */
export function KueueGlance({ node }: { node: GraphNode }) {
  const labels = getKueueGlanceLabels(node.kubeObject);

  if (!labels) {
    return null;
  }

  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap">
      {labels.map(label => (
        <StatusLabel key={label} status="">
          {label}
        </StatusLabel>
      ))}
    </Box>
  );
}
