import { Link, ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useMemo } from 'react';
import { VolcanoPodGroup } from '../../resources/podgroup';
import { VolcanoQueue } from '../../resources/queue';
import { getQueueStatusColor } from '../../utils/status';
import { volcanoRouteNames } from '../../utils/volcanoRoutes';
import { VolcanoCoreInstallCheck } from '../common/CommonComponents';
import { getQueuePodGroupStatsByCluster } from './stats';

/**
 * Renders the Volcano Queues list page.
 *
 * @returns Queues resource list view.
 */
export default function QueueList() {
  const [podGroups] = VolcanoPodGroup.useList();
  const statsByCluster = useMemo(() => getQueuePodGroupStatsByCluster(podGroups), [podGroups]);
  const getStats = (queue: VolcanoQueue) => statsByCluster[queue.cluster]?.[queue.metadata.name];

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
                <Link
                  routeName={volcanoRouteNames.queueDetail}
                  params={{ name: queue.spec.parent }}
                >
                  {queue.spec.parent}
                </Link>
              ) : (
                '-'
              ),
          },
          {
            id: 'inqueue',
            label: 'Inqueue',
            getValue: (queue: VolcanoQueue) => getStats(queue)?.inqueue ?? 0,
          },
          {
            id: 'pending',
            label: 'Pending',
            getValue: (queue: VolcanoQueue) => getStats(queue)?.pending ?? 0,
          },
          {
            id: 'running',
            label: 'Running',
            getValue: (queue: VolcanoQueue) => getStats(queue)?.running ?? 0,
          },
          {
            id: 'unknown',
            label: 'Unknown',
            getValue: (queue: VolcanoQueue) => getStats(queue)?.unknown ?? 0,
          },
          {
            id: 'completed',
            label: 'Completed',
            getValue: (queue: VolcanoQueue) => getStats(queue)?.completed ?? 0,
          },
          'age',
        ]}
      />
    </VolcanoCoreInstallCheck>
  );
}
