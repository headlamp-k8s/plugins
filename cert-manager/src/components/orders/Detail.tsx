import { Icon } from '@iconify/react';
import {
  DetailsGrid,
  LabelListItem,
  Link,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { IconButton } from '@mui/material';
import { Tooltip } from '@mui/material';
import { useParams } from 'react-router-dom';
import { Order } from '../../types/order';

export function OrderDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <DetailsGrid
      resourceType={Order}
      namespace={namespace}
      name={name}
      withEvents
      extraInfo={item =>
        item && [
          {
            name: 'Common Name',
            value: item.spec.commonName,
          },
          {
            name: 'DNS Names',
            value: (
              <div>
                {item.spec?.dnsNames?.map(dnsName => (
                  <div style={{ marginBottom: '10px' }}>
                    <LabelListItem labels={[dnsName]} />
                  </div>
                ))}
              </div>
            ),
          },
          {
            name: 'Issuer Ref',
            value: item.spec.issuerRef && (
              <NameValueTable
                rows={[
                  {
                    name: 'Name',
                    value: (
                      <Link
                        routeName={
                          item.spec.issuerRef?.kind === 'Issuer'
                            ? '/cert-manager/issuers/:namespace/:name'
                            : '/cert-manager/clusterissuers/:name'
                        }
                        params={
                          item.spec.issuerRef?.kind === 'Issuer'
                            ? {
                                name: item.spec.issuerRef?.name,
                                namespace: item.metadata.namespace,
                              }
                            : { name: item.spec.issuerRef?.name }
                        }
                      >
                        {item.spec.issuerRef?.name}
                      </Link>
                    ),
                  },
                  {
                    name: 'Kind',
                    value: item.spec.issuerRef?.kind,
                  },
                ]}
              />
            ),
          },
          {
            name: 'Request',
            value: (
              <div>
                <Tooltip title={item.spec.request}>{item.spec.request.substring(0, 50)}...</Tooltip>

                <IconButton
                  onClick={() => {
                    navigator.clipboard.writeText(item.spec.request);
                  }}
                >
                  <Icon icon="mdi:content-copy" />
                </IconButton>
              </div>
            ),
          },
        ]
      }
      extraSections={item =>
        item && [
          {
            id: 'Authorizations',
            section: item?.status && (
              <SectionBox title="Authorizations">
                {item.status.authorizations.map((auth, index) => (
                  <NameValueTable
                    key={index}
                    rows={[
                      { name: 'Identifier', value: auth.identifier },
                      { name: 'Initial State', value: auth.initialState },
                      { name: 'URL', value: auth.url },
                      { name: 'Wildcard', value: auth.wildcard?.toString() || 'false' },
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
                ))}
              </SectionBox>
            ),
          },
          {
            id: 'Status',
            section: item?.status && (
              <SectionBox title="Status">
                <NameValueTable
                  rows={[
                    { name: 'State', value: item.status.state },
                    { name: 'URL', value: item.status.url },
                    { name: 'Finalize URL', value: item.status.finalizeURL },
                  ]}
                />
              </SectionBox>
            ),
          },
        ]
      }
    />
  );
}
