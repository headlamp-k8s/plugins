import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ClusterQueue } from '../../resources/clusterQueue';
import { Workload } from '../../resources/workload';
import KueueAdminResourceAccess, {
  KueueInstallationGate,
} from '../common/KueueAdminResourceAccess';
import { renderCohortLink } from '../common/KueueResourceLinks';

export default function KueueOverview() {
  // One installation gate for the page, so a cluster without Kueue gets one empty state.
  return (
    <KueueInstallationGate>
      <KueueAdminResourceAccess
        resourceClass={Workload}
        resourceLabel="Workloads"
        verb="list"
        accessDescription="Kueue Workloads are namespaced user workload resources."
        installationChecked
      >
        <ResourceListView
          title="Blocked Workloads"
          id="kueue-overview-blocked-workloads"
          resourceClass={Workload}
          filterFunction={(workload: Workload) => !!workload.blockerStage}
          defaultSortingColumn={{ id: 'blockedOn', desc: false }}
          columns={[
            'name',
            'namespace',
            {
              id: 'queue',
              label: 'Queue',
              getValue: (workload: Workload) => workload.queueNameDisplay,
            },
            {
              id: 'status',
              label: 'Status',
              getValue: (workload: Workload) => workload.statusDisplay,
            },
            {
              id: 'blockedOn',
              label: 'Blocked On',
              getValue: (workload: Workload) => workload.blockerStageDisplay,
            },
            'age',
          ]}
        />
      </KueueAdminResourceAccess>
      <KueueAdminResourceAccess
        resourceClass={ClusterQueue}
        resourceLabel="ClusterQueues"
        verb="list"
        installationChecked
      >
        <ResourceListView
          title="ClusterQueues"
          id="kueue-overview-clusterqueues"
          resourceClass={ClusterQueue}
          columns={[
            'name',
            {
              id: 'cohort',
              label: 'Cohort',
              getValue: (clusterQueue: ClusterQueue) => clusterQueue.cohortName,
              render: (clusterQueue: ClusterQueue) =>
                renderCohortLink(clusterQueue.spec.cohortName, clusterQueue.cluster),
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
          ]}
        />
      </KueueAdminResourceAccess>
    </KueueInstallationGate>
  );
}
