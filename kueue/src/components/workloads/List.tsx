import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useTranslation } from 'react-i18next';
import { Workload } from '../../resources/workload';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function WorkloadList() {
  const { t } = useTranslation();

  return (
    <KueueAdminResourceAccess
      resourceClass={Workload}
      resourceLabel={t('Workloads')}
      verb="list"
      accessDescription={t('Kueue Workloads are namespaced user workload resources.')}
    >
      <ResourceListView
        title={t('Kueue Workloads')}
        resourceClass={Workload}
        columns={[
          'name',
          'namespace',
          {
            id: 'queue',
            label: t('Queue'),
            getValue: (workload: Workload) => workload.queueNameDisplay,
          },
          {
            id: 'priority',
            label: t('Priority'),
            getValue: (workload: Workload) => workload.priorityDisplay,
          },
          {
            id: 'priorityClass',
            label: t('Priority Class'),
            getValue: (workload: Workload) => workload.priorityClassDisplay,
          },
          {
            id: 'active',
            label: t('Active'),
            getValue: (workload: Workload) => workload.activeDisplay,
          },
          {
            id: 'admitted',
            label: t('Admitted'),
            getValue: (workload: Workload) => workload.admittedDisplay,
          },
          {
            id: 'finished',
            label: t('Finished'),
            getValue: (workload: Workload) => workload.finishedDisplay,
          },
          {
            id: 'status',
            label: t('Status'),
            getValue: (workload: Workload) => workload.statusDisplay,
          },
          'age',
        ]}
      />
    </KueueAdminResourceAccess>
  );
}
