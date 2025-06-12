import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useKedaInstalled } from '../../hooks/useKedaInstalled';
import { ScaledJob } from '../../resources/scaledjob';
import { NotInstalledBanner } from '../common/CommonComponents';

export function ScaledJobsList() {
  const { isKedaInstalled, isKedaCheckLoading } = useKedaInstalled();

  return isKedaInstalled ? (
    <ResourceListView
      title="ScaledJobs"
      resourceClass={ScaledJob}
      columns={[
        'name',
        'namespace',
        {
          id: 'min-replica-count',
          label: 'Min',
          getValue: item => item.minReplicaCount,
        },
        {
          id: 'max-replica-count',
          label: 'Max',
          getValue: item => item.maxReplicaCount,
        },
        {
          id: 'ready-status',
          label: 'Ready',
          getValue: item => `${item.readyStatus}`,
        },
        {
          id: 'active-status',
          label: 'Active',
          getValue: item => `${item.activeStatus}`,
        },
        {
          id: 'paused-status',
          label: 'Paused',
          getValue: item => `${item.pausedStatus}`,
        },
        {
          id: 'triggers',
          label: 'Triggers',
          getValue: item =>
            Array.isArray(item?.spec?.triggers)
              ? item.spec.triggers.map(trigger => trigger.type).join(',')
              : '-',
        },
        'age',
      ]}
    />
  ) : (
    <NotInstalledBanner isLoading={isKedaCheckLoading} />
  );
}
