import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ClusterQueue } from '../../resources/clusterQueue';
import { LocalQueue } from '../../resources/localQueue';

export default function LocalQueueList() {
  return (
    <ResourceListView
      title="Kueue LocalQueues"
        resourceClass={LocalQueue}
        columns={[
          'name',
          'namespace',
          {
            id: 'clusterQueue',
            label: ClusterQueue.kind,
            getValue: (localQueue: LocalQueue) => localQueue.clusterQueueDisplay,
          },
          {
            id: 'stopPolicy',
            label: 'Stop Policy',
            getValue: (localQueue: LocalQueue) => localQueue.stopPolicyDisplay,
          },
          {
            id: 'pendingWorkloads',
            label: 'Pending Workloads',
            getValue: (localQueue: LocalQueue) => localQueue.pendingWorkloads,
          },
          {
            id: 'admittedWorkloads',
            label: 'Admitted Workloads',
            getValue: (localQueue: LocalQueue) => localQueue.admittedWorkloads,
          },
          {
            id: 'reservingWorkloads',
            label: 'Reserving Workloads',
            getValue: (localQueue: LocalQueue) => localQueue.reservingWorkloads,
          },
          {
            id: 'status',
            label: 'Status',
            getValue: (localQueue: LocalQueue) => localQueue.statusDisplay,
          },
          'age',
        ]}
      />
  );
}
