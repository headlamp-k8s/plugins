import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { ScaledJob } from '../../resources/scaledjob';
import { KedaInstallCheck } from '../common/CommonComponents';

export function ScaledJobsList() {
  const { t } = useTranslation();

  return (
    <KedaInstallCheck>
      <ResourceListView
        title={t('ScaledJobs')}
        resourceClass={ScaledJob}
        columns={[
          'name',
          'namespace',
          {
            id: 'min-replica-count',
            label: t('Min'),
            getValue: item => item.minReplicaCount,
          },
          {
            id: 'max-replica-count',
            label: t('Max'),
            getValue: item => item.maxReplicaCount,
          },
          {
            id: 'ready-status',
            label: t('Ready'),
            getValue: item => `${item.readyStatus}`,
          },
          {
            id: 'active-status',
            label: t('Active'),
            getValue: item => `${item.activeStatus}`,
          },
          {
            id: 'paused-status',
            label: t('Paused'),
            getValue: item => `${item.pausedStatus}`,
          },
          {
            id: 'triggers',
            label: t('Triggers'),
            getValue: item =>
              Array.isArray(item?.spec?.triggers)
                ? item.spec.triggers.map(trigger => trigger.type).join(',')
                : '-',
          },
          'age',
        ]}
      />
    </KedaInstallCheck>
  );
}
