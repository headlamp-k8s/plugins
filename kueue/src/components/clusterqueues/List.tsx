import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ClusterQueue } from '../../resources/clusterQueue';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function ClusterQueueList() {
  return (
    <KueueAdminResourceAccess
      resourceClass={ClusterQueue}
      resourceLabel="ClusterQueues"
      verb="list"
    >
      <ResourceListView
        title="Kueue ClusterQueues"
        resourceClass={ClusterQueue}
        columns={[
          'name',
          {
            id: 'cohort',
            label: 'Cohort',
            getValue: (clusterQueue: ClusterQueue) => clusterQueue.cohortName,
          },
          {
            id: 'queueingStrategy',
            label: 'Queueing Strategy',
            getValue: (clusterQueue: ClusterQueue) => clusterQueue.queueingStrategy,
          },
          {
            id: 'resourceGroups',
            label: 'Resource Groups',
            getValue: (clusterQueue: ClusterQueue) => clusterQueue.resourceGroupsDisplay,
          },
          {
            id: 'resourceFlavors',
            label: 'Resource Flavors',
            getValue: (clusterQueue: ClusterQueue) => clusterQueue.referencedFlavorNamesDisplay,
          },
          {
            id: 'pendingWorkloads',
            label: 'Pending Workloads',
            getValue: (clusterQueue: ClusterQueue) => clusterQueue.pendingWorkloads,
          },
          {
            id: 'admittedWorkloads',
            label: 'Admitted Workloads',
            getValue: (clusterQueue: ClusterQueue) => clusterQueue.admittedWorkloads,
          },
          {
            id: 'status',
            label: 'Status',
            getValue: (clusterQueue: ClusterQueue) => clusterQueue.statusDisplay,
          },
          'age',
        ]}
      />
    </KueueAdminResourceAccess>
  );
}
