import { K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { DateLabel, Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { ExternalSecret } from '../../resources/externalSecret';
import { ESOInstallCheck, ReadyStatusLabel } from '../common/CommonComponents';

export function ExternalSecretsList() {
  const { t } = useTranslation();

  return (
    <ESOInstallCheck>
      <ResourceListView
        title={t('ExternalSecrets')}
        resourceClass={ExternalSecret}
        columns={[
          'name',
          'namespace',
          {
            id: 'store',
            label: t('Store'),
            getValue: item => `${item.storeKind}/${item.storeName}`,
          },
          {
            id: 'target-secret',
            label: t('Target Secret'),
            getValue: item => item.targetSecretName,
            render: item => (
              <Link
                routeName={K8s.ResourceClasses.Secret.kind}
                params={{
                  name: item.targetSecretName,
                  namespace: item.metadata.namespace,
                }}
              >
                {item.targetSecretName}
              </Link>
            ),
          },
          {
            id: 'ready',
            label: t('Ready'),
            getValue: item => (item.ready ? t('Ready') : t('Not Ready')),
            render: item => (
              <ReadyStatusLabel ready={item.ready} reason={item.readyCondition?.reason} />
            ),
          },
          {
            id: 'refresh-interval',
            label: t('Refresh Interval'),
            getValue: item => item.spec?.refreshInterval || '-',
          },
          {
            id: 'last-refresh',
            label: t('Last Refresh'),
            getValue: item => item.lastRefresh || '',
            render: item =>
              item.lastRefresh ? <DateLabel date={item.lastRefresh} format="mini" /> : <>-</>,
          },
          'age',
        ]}
      />
    </ESOInstallCheck>
  );
}
