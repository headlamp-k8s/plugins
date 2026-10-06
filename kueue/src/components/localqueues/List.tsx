import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ClusterQueue } from '../../resources/clusterQueue';
import { LocalQueue } from '../../resources/localQueue';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function LocalQueueList() {
  const { t } = useTranslation();

  return (
    <KueueAdminResourceAccess
      resourceClass={LocalQueue}
      resourceLabel={t('LocalQueues')}
      verb="list"
      accessDescription={t('Kueue LocalQueues are namespaced user queue resources.')}
    >
      <ResourceListView
        title={t('LocalQueues')}
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
            label: t('Stop Policy'),
            getValue: (localQueue: LocalQueue) => localQueue.stopPolicyDisplay,
          },
          {
            id: 'pendingWorkloads',
            label: t('Pending Workloads'),
            getValue: (localQueue: LocalQueue) => localQueue.pendingWorkloads,
          },
          {
            id: 'admittedWorkloads',
            label: t('Admitted Workloads'),
            getValue: (localQueue: LocalQueue) => localQueue.admittedWorkloads,
          },
          {
            id: 'reservingWorkloads',
            label: t('Reserving Workloads'),
            getValue: (localQueue: LocalQueue) => localQueue.reservingWorkloads,
          },
          {
            id: 'status',
            label: t('Status'),
            getValue: (localQueue: LocalQueue) => localQueue.statusDisplay,
          },
          'age',
        ]}
      />
    </KueueAdminResourceAccess>
  );
}
