import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { ScaledObject } from '../../resources/scaledobject';
import { KedaInstallCheck } from '../common/CommonComponents';

export function ScaledObjectsList() {
  const { t } = useTranslation();

  return (
    <KedaInstallCheck>
      <ResourceListView
        title={t('ScaledObjects')}
        resourceClass={ScaledObject}
        columns={[
          'name',
          'namespace',
          {
            id: 'scale-target',
            label: t('ScaleTarget'),
            getValue: null,
            render: item => (
              <Link
                routeName={item.scaleTargetKind}
                params={{ name: item.scaleTargetName, namespace: item.metadata.namespace }}
              >
                {item.scaleTargetKind}/{item.scaleTargetName}
              </Link>
            ),
          },
          {
            id: 'replica-count',
            label: t('Min-Max'),
            getValue: item => `${item.minReplicaCount}-${item.maxReplicaCount}`,
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
            id: 'fallback-status',
            label: t('Fallback'),
            getValue: item => `${item.fallbackStatus}`,
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
