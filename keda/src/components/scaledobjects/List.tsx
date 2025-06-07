import { Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useKedaInstalled } from '../../hooks/useKedaInstalled';
import { ScaledObject } from '../../resources/scaledobject';
import { TriggerAuthentication } from '../../resources/triggerAuthentication';
import { NotInstalledBanner } from '../common/CommonComponents';

export function ScaledObjectsList() {
  const { isKedaInstalled, isKedaCheckLoading } = useKedaInstalled();

  return isKedaInstalled ? (
    <ResourceListView
      title="ScaledObjects"
      resourceClass={ScaledObject}
      columns={[
        'name',
        'namespace',
        {
          id: 'scale-target',
          label: 'ScaleTarget',
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
          label: 'Min-Max',
          getValue: item => `${item.minReplicaCount}-${item.maxReplicaCount}`,
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
          id: 'fallback-status',
          label: 'Fallback',
          getValue: item => `${item.fallbackStatus}`,
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
