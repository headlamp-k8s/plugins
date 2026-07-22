import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  DetailsGrid,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { Order } from '../../resources/order';
import {
  CopyToClipboard,
  IssuerRef,
  NotInstalledBanner,
  StringArray,
} from '../common/CommonComponents';

export function OrderDetail() {
  const { t } = useTranslation();
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const { isManagerInstalled, isCertManagerCheckLoading } = useCertManagerInstalled();

  return (
    <>
      {isManagerInstalled ? (
        <DetailsGrid
          resourceType={Order}
          namespace={namespace}
          name={name}
          withEvents
          extraInfo={item =>
            item && [
              {
                name: t('Common Name'),
                value: item.spec?.commonName,
              },
              {
                name: t('DNS Names'),
                value: <StringArray items={item.spec?.dnsNames} />,
              },
              {
                name: t('IP Addresses'),
                value: <StringArray items={item.spec?.ipAddresses} />,
              },
              {
                name: t('Duration'),
                value: item.spec?.duration,
              },
              {
                name: t('Issuer Ref'),
                value: item.spec.issuerRef && (
                  <IssuerRef issuerRef={item.spec.issuerRef} namespace={item.metadata?.namespace} />
                ),
              },
              {
                name: t('Request'),
                value: <CopyToClipboard text={item.spec.request} />,
              },
            ]
          }
          extraSections={item =>
            item && [
              {
                id: 'Authorizations',
                section: item.status?.authorizations && (
                  <SectionBox title={t('Authorizations')}>
                    {item.status?.authorizations.map((auth, index) => (
                      <div key={index} style={{ marginBottom: '20px' }}>
                        <NameValueTable
                          rows={[
                            { name: t('Identifier'), value: auth.identifier },
                            { name: t('Initial State'), value: auth?.initialState },
                            { name: t('URL'), value: auth.url },
                            { name: t('Wildcard'), value: auth.wildcard ? t('Yes') : t('No') },
                            {
                              name: t('Challenges'),
                              value: (
                                <SimpleTable
                                  columns={[
                                    {
                                      label: t('Type'),
                                      getter: challenge => challenge.type,
                                    },
                                    {
                                      label: t('Token'),
                                      getter: challenge => challenge.token,
                                    },
                                    {
                                      label: t('URL'),
                                      getter: challenge => challenge.url,
                                    },
                                  ]}
                                  data={auth.challenges}
                                />
                              ),
                            },
                          ]}
                        />
                      </div>
                    ))}
                  </SectionBox>
                ),
              },
              {
                id: 'Status',
                section: item.status && (
                  <SectionBox title={t('Status')}>
                    <NameValueTable
                      rows={[
                        { name: t('State'), value: item.status?.state },
                        { name: t('URL'), value: item.status?.url },
                        { name: t('Finalize URL'), value: item.status?.finalizeURL },
                        {
                          name: t('Certificate'),
                          value: item.status?.certificate ? (
                            <CopyToClipboard text={item.status?.certificate} />
                          ) : (
                            ''
                          ),
                        },
                        { name: t('Failure Time'), value: item.status?.failureTime },
                        { name: t('Reason'), value: item.status?.reason },
                      ]}
                    />
                  </SectionBox>
                ),
              },
            ]
          }
        />
      ) : (
        <NotInstalledBanner isLoading={isCertManagerCheckLoading} />
      )}
    </>
  );
}
