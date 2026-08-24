import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Link as MuiLink } from '@mui/material';
import { ClusterQueue } from '../../resources/clusterQueue';
import { LocalQueue } from '../../resources/localQueue';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';
import { openLocalQueueActivity } from './Detail';

export default function LocalQueueList() {
  return (
    <KueueAdminResourceAccess
      resourceClass={LocalQueue}
      resourceLabel="LocalQueues"
      verb="list"
      accessDescription="Kueue LocalQueues are namespaced user queue resources."
    >
      <ResourceListView
        title="Kueue LocalQueues"
        resourceClass={LocalQueue}
        columns={[
          {
            id: 'name',
            label: 'Name',
            getValue: (localQueue: LocalQueue) => localQueue.metadata.name,
            render: (localQueue: LocalQueue) => (
              <MuiLink
                component="button"
                sx={{ textAlign: 'left' }}
                onClick={() =>
                  openLocalQueueActivity(
                    localQueue.metadata.namespace,
                    localQueue.metadata.name,
                    localQueue.cluster
                  )
                }
              >
                {localQueue.metadata.name}
              </MuiLink>
            ),
          },
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
    </KueueAdminResourceAccess>
  );
}
