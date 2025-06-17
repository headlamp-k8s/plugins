import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { ScaledJob } from '../../resources/scaledjob';
import { KedaInstallCheck } from '../common/CommonComponents';

export function ScaledJobsList() {
  return (
    <KedaInstallCheck>
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
    </KedaInstallCheck>
  );
}
