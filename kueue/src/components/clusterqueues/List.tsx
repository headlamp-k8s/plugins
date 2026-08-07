import { Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ClusterQueue } from '../../resources/clusterQueue';
import { kueueRouteNames } from '../../utils/kueueRoutes';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

/** Render a ClusterQueue Cohort value as a detail-page link when present. */
function renderCohortLink(clusterQueue: ClusterQueue) {
  const cohortName = clusterQueue.spec.cohortName;

  if (!cohortName) {
    return '-';
  }

  return (
    <Link routeName={kueueRouteNames.cohortDetail} params={{ name: cohortName }}>
      {cohortName}
    </Link>
  );
}

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
            render: (clusterQueue: ClusterQueue) => renderCohortLink(clusterQueue),
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
