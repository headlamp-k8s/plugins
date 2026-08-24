import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Link as MuiLink } from '@mui/material';
import { ClusterQueue } from '../../resources/clusterQueue';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';
import { openClusterQueueActivity } from './Detail';

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
          {
            id: 'name',
            label: 'Name',
            getValue: (clusterQueue: ClusterQueue) => clusterQueue.metadata.name,
            render: (clusterQueue: ClusterQueue) => (
              <MuiLink
                component="button"
                sx={{ textAlign: 'left' }}
                onClick={() =>
                  openClusterQueueActivity(clusterQueue.metadata.name, clusterQueue.cluster)
                }
              >
                {clusterQueue.metadata.name}
              </MuiLink>
            ),
          },
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
