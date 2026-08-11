import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ClusterQueue } from '../../resources/clusterQueue';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function ClusterQueueList() {
  const { t } = useTranslation();

  return (
    <KueueAdminResourceAccess
      resourceClass={ClusterQueue}
      resourceLabel={t('ClusterQueues')}
      verb="list"
    >
      <ResourceListView
        title={t('ClusterQueues')}
        resourceClass={ClusterQueue}
        columns={[
          'name',
          {
            id: 'cohort',
            label: t('Cohort'),
            getValue: (clusterQueue: ClusterQueue) => clusterQueue.cohortName,
          },
          {
            id: 'queueingStrategy',
            label: t('Queueing Strategy'),
            getValue: (clusterQueue: ClusterQueue) => clusterQueue.queueingStrategy,
          },
          {
            id: 'resourceGroups',
            label: t('Resource Groups'),
            getValue: (clusterQueue: ClusterQueue) => clusterQueue.resourceGroupsDisplay,
          },
          {
            id: 'resourceFlavors',
            label: t('Resource Flavors'),
            getValue: (clusterQueue: ClusterQueue) => clusterQueue.referencedFlavorNamesDisplay,
          },
          {
            id: 'pendingWorkloads',
            label: t('Pending Workloads'),
            getValue: (clusterQueue: ClusterQueue) => clusterQueue.pendingWorkloads,
          },
          {
            id: 'admittedWorkloads',
            label: t('Admitted Workloads'),
            getValue: (clusterQueue: ClusterQueue) => clusterQueue.admittedWorkloads,
          },
          {
            id: 'status',
            label: t('Status'),
            getValue: (clusterQueue: ClusterQueue) => clusterQueue.statusDisplay,
          },
          'age',
        ]}
      />
    </KueueAdminResourceAccess>
  );
}
