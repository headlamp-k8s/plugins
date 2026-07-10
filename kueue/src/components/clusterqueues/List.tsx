import { ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ClusterQueue } from '../../resources/clusterQueue';

export default function ClusterQueueList() {
  return (
    <ResourceListView
      title="ClusterQueues"
      resourceClass={ClusterQueue}
      columns={[
        'name',
        {
          id: 'cohort',
          label: 'Cohort',
          getValue: (cq: ClusterQueue) => cq.cohort,
        },
        {
          id: 'queueingStrategy',
          label: 'Queueing Strategy',
          getValue: (cq: ClusterQueue) => cq.queueingStrategy,
        },
        {
          id: 'pendingWorkloads',
          label: 'Pending Workloads',
          getValue: (cq: ClusterQueue) => cq.pendingWorkloads,
        },
        {
          id: 'admittedWorkloads',
          label: 'Admitted Workloads',
          getValue: (cq: ClusterQueue) => cq.admittedWorkloads,
        },
        {
          id: 'status',
          label: 'Status',
          getValue: (cq: ClusterQueue) => cq.statusMessage,
          render: (cq: ClusterQueue) => (
            <StatusLabel status={cq.isActive ? 'success' : 'error'}>
              {cq.statusMessage}
            </StatusLabel>
          ),
        },
        'age',
      ]}
    />
  );
}
