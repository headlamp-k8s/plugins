import { Link, ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useMemo } from 'react';
import { VolcanoPodGroup } from '../../resources/podgroup';
import { VolcanoQueue } from '../../resources/queue';
import { getQueueStatusColor } from '../../utils/status';
import { VolcanoCoreInstallCheck } from '../common/CommonComponents';
import { getQueuePodGroupStats } from './stats';

/**
 * Renders the Volcano Queues list page.
 *
 * @returns Queues resource list view.
 */
export default function QueueList() {
  const [podGroups] = VolcanoPodGroup.useList();
  const queuePodGroupStats = useMemo(() => getQueuePodGroupStats(podGroups), [podGroups]);

  return (
    <VolcanoCoreInstallCheck>
      <ResourceListView
        title="Volcano Queues"
        resourceClass={VolcanoQueue}
        columns={[
          'name',
          {
            id: 'state',
            label: 'State',
            getValue: (queue: VolcanoQueue) => queue.state,
            render: (queue: VolcanoQueue) => (
              <StatusLabel status={getQueueStatusColor(queue.state)}>{queue.state}</StatusLabel>
            ),
          },
          {
            id: 'weight',
            label: 'Weight',
            getValue: (queue: VolcanoQueue) => queue.weight,
          },
          {
            id: 'parent',
            label: 'Parent',
            getValue: (queue: VolcanoQueue) => queue.spec.parent || '-',
            render: (queue: VolcanoQueue) =>
              queue.spec.parent ? (
                <Link routeName="volcano-queue-detail" params={{ name: queue.spec.parent }}>
                  {queue.spec.parent}
                </Link>
              ) : (
                '-'
              ),
          },
          {
            id: 'inqueue',
            label: 'Inqueue',
            getValue: (queue: VolcanoQueue) =>
              queuePodGroupStats[queue.metadata.name]?.inqueue ?? 0,
          },
          {
            id: 'pending',
            label: 'Pending',
            getValue: (queue: VolcanoQueue) =>
              queuePodGroupStats[queue.metadata.name]?.pending ?? 0,
          },
          {
            id: 'running',
            label: 'Running',
            getValue: (queue: VolcanoQueue) =>
              queuePodGroupStats[queue.metadata.name]?.running ?? 0,
          },
          {
            id: 'unknown',
            label: 'Unknown',
            getValue: (queue: VolcanoQueue) =>
              queuePodGroupStats[queue.metadata.name]?.unknown ?? 0,
          },
          {
            id: 'completed',
            label: 'Completed',
            getValue: (queue: VolcanoQueue) =>
              queuePodGroupStats[queue.metadata.name]?.completed ?? 0,
          },
          'age',
        ]}
      />
    </VolcanoCoreInstallCheck>
  );
}
