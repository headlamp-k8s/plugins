import { Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useKedaInstalled } from '../../hooks/useKedaInstalled';
import { ScaledJob } from '../../resources/scaledjob';
import { TriggerAuthentication } from '../../resources/triggerAuthentication';
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
            item.spec.triggers && item.spec.triggers.length > 0 ? item.spec.triggers[0].type : '-',
        },
        {
          id: 'authentications',
          label: 'Authentications',
          getValue: null,
          render: item => {
            const triggerAuthenticationRefs = item.spec.triggers
              .map(trigger => trigger.authenticationRef)
              .filter(Boolean);

            if (!triggerAuthenticationRefs.length) return <span>-</span>;

            return (
              <Link
                key={triggerAuthenticationRefs[0].name}
                routeName={triggerAuthenticationRefs[0].kind ?? TriggerAuthentication.kind}
                params={{
                  name: triggerAuthenticationRefs[0].name,
                  namespace: item.metadata.namespace,
                }}
              >
                {triggerAuthenticationRefs[0].name}
              </Link>
            );
          },
        },
        'age',
      ]}
    />
  ) : (
    <NotInstalledBanner isLoading={isKedaCheckLoading} />
  );
}
