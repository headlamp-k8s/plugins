import { Link, ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { VolcanoQueue } from '../../resources/queue';
import { getQueueStatusColor } from '../../utils/status';
import { VolcanoInstallCheck } from '../common/CommonComponents';

/**
 * Renders the Volcano Queues list page.
 *
 * @returns Queues resource list view.
 */
export default function QueueList() {
  return (
    <VolcanoInstallCheck>
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
          'age',
        ]}
      />
    </VolcanoInstallCheck>
  );
}
