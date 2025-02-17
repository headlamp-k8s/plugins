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
                name: 'Common Name',
                value: item.spec?.commonName,
              },
              {
                name: 'DNS Names',
                value: <StringArray items={item.spec?.dnsNames} />,
              },
              {
                name: 'IP Addresses',
                value: <StringArray items={item.spec?.ipAddresses} />,
              },
              {
                name: 'Duration',
                value: item.spec?.duration,
              },
              {
                name: 'Issuer Ref',
                value: item.spec.issuerRef && (
                  <IssuerRef issuerRef={item.spec.issuerRef} namespace={item.metadata?.namespace} />
                ),
              },
              {
                name: 'Request',
                value: <CopyToClipboard text={item.spec.request} />,
              },
            ]
          }
          extraSections={item =>
            item && [
              {
                id: 'Authorizations',
                section: item.status?.authorizations && (
                  <SectionBox title="Authorizations">
                    {item.status?.authorizations.map((auth, index) => (
                      <div key={index} style={{ marginBottom: '20px' }}>
                        <NameValueTable
                          rows={[
                            { name: 'Identifier', value: auth.identifier },
                            { name: 'Initial State', value: auth?.initialState },
                            { name: 'URL', value: auth.url },
                            { name: 'Wildcard', value: auth.wildcard.toString() },
                            {
                              name: 'Challenges',
                              value: (
                                <SimpleTable
                                  columns={[
                                    {
                                      label: 'Type',
                                      getter: challenge => challenge.type,
                                    },
                                    {
                                      label: 'Token',
                                      getter: challenge => challenge.token,
                                    },
                                    {
                                      label: 'URL',
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
                  <SectionBox title="Status">
                    <NameValueTable
                      rows={[
                        { name: 'State', value: item.status?.state },
                        { name: 'URL', value: item.status?.url },
                        { name: 'Finalize URL', value: item.status?.finalizeURL },
                        {
                          name: 'Certificate',
                          value: item.status?.certificate ? (
                            <CopyToClipboard text={item.status?.certificate} />
                          ) : (
                            ''
                          ),
                        },
                        { name: 'Failure Time', value: item.status?.failureTime },
                        { name: 'Reason', value: item.status?.reason },
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
