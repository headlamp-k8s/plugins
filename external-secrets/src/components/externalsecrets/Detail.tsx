import { K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  ConditionsSection,
  DateLabel,
  DetailsGrid,
  Link,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { ExternalSecret } from '../../resources/externalSecret';
import { ESOInstallCheck, ReadyStatusLabel, SecretDataSection } from '../common/CommonComponents';

export function ExternalSecretDetail(props: { namespace?: string; name?: string }) {
  const { t } = useTranslation();
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <ESOInstallCheck>
      <DetailsGrid
        resourceType={ExternalSecret}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={item =>
          item && [
            {
              name: t('API Version'),
              value: ExternalSecret.apiVersion,
            },
            {
              name: t('Store'),
              value: `${item.storeKind}/${item.storeName}`,
            },
            {
              name: t('Target Secret'),
              value: (
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
              name: t('Ready'),
              value: <ReadyStatusLabel ready={item.ready} reason={item.readyCondition?.reason} />,
            },
            ...(item.readyCondition?.message
              ? [
                  {
                    name: t('Status Message'),
                    value: item.readyCondition.message,
                  },
                ]
              : []),
            {
              name: t('Refresh Interval'),
              value: item.spec?.refreshInterval || '-',
            },
            ...(item.spec?.refreshPolicy
              ? [
                  {
                    name: t('Refresh Policy'),
                    value: item.spec.refreshPolicy,
                  },
                ]
              : []),
            {
              name: t('Last Refresh'),
              value: item.lastRefresh ? <DateLabel date={item.lastRefresh} /> : '-',
            },
            ...(item.status?.syncedResourceVersion
              ? [
                  {
                    name: t('Synced Resource Version'),
                    value: item.status.syncedResourceVersion,
                  },
                ]
              : []),
          ]
        }
        extraSections={item =>
          item && [
            {
              id: 'eso-data',
              section: <SecretDataSection data={item.spec?.data} dataFrom={item.spec?.dataFrom} />,
            },
            {
              id: 'eso-conditions',
              section: <ConditionsSection resource={item.jsonData} />,
            },
          ]
        }
      />
    </ESOInstallCheck>
  );
}
