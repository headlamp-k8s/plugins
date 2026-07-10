import { Link, ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { LocalQueue } from '../../resources/localQueue';
import { kueueRouteNames } from '../../utils/kueueRoutes';

export default function LocalQueueList() {
  return (
    <ResourceListView
      title="LocalQueues"
      resourceClass={LocalQueue}
      columns={[
        'name',
        'namespace',
        {
          id: 'clusterQueue',
          label: 'ClusterQueue',
          getValue: (lq: LocalQueue) => lq.clusterQueue,
          render: (lq: LocalQueue) => (
            lq.clusterQueue && lq.clusterQueue !== '-' ? (
              <Link routeName={kueueRouteNames.clusterQueueDetail} params={{ name: lq.clusterQueue }}>
                {lq.clusterQueue}
              </Link>
            ) : (
              '-'
            )
          ),
        },
        {
          id: 'pendingWorkloads',
          label: 'Pending Workloads',
          getValue: (lq: LocalQueue) => lq.pendingWorkloads,
        },
        {
          id: 'admittedWorkloads',
          label: 'Admitted Workloads',
          getValue: (lq: LocalQueue) => lq.admittedWorkloads,
        },
        {
          id: 'status',
          label: 'Status',
          getValue: (lq: LocalQueue) => lq.statusMessage,
          render: (lq: LocalQueue) => (
            <StatusLabel status={lq.isActive ? 'success' : 'error'}>
              {lq.statusMessage}
            </StatusLabel>
          ),
        },
        'age',
      ]}
    />
  );
}
