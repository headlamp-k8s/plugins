import { Icon } from '@iconify/react';
import {
  DetailsGrid,
  LabelListItem,
  Link,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Tooltip } from '@mui/material';
import { IconButton } from '@mui/material';
import { useParams } from 'react-router-dom';
import { CertificateRequest } from '../../types/certificateRequest';

export function CertificateRequestDetail() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();
  return (
    <DetailsGrid
      resourceType={CertificateRequest}
      name={name}
      withEvents
      namespace={namespace}
      extraInfo={item =>
        item && [
          {
            name: 'Ready',
            value: item.ready ? 'Ready' : 'Not Ready',
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
                          !item.spec.issuerRef?.kind || item.spec.issuerRef?.kind === 'Issuer'
                            ? '/cert-manager/issuers/:namespace/:name'
                            : '/cert-manager/clusterissuers/:name'
                        }
                        params={
                          !item.spec.issuerRef?.kind || item.spec.issuerRef?.kind === 'Issuer'
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
                    value: item.spec.issuerRef.kind,
                  },
                ]}
              />
            ),
          },
          {
            name: 'Duration',
            value: item.spec.duration,
          },
          {
            name: 'Username',
            value: item.spec.username,
          },
          {
            name: 'UID',
            value: item.spec.uid,
          },
          {
            name: 'Groups',
            value:
              item.spec.groups &&
              item.spec.groups.map(group => (
                <div style={{ marginBottom: '10px' }}>
                  <LabelListItem labels={[group]} />
                </div>
              )),
          },
          {
            name: 'Extra',
            value: item.spec.extra && (
              <NameValueTable
                rows={Object.entries(item.spec.extra).map(([key, value]) => ({
                  name: key,
                  value: value.join(', '),
                }))}
              />
            ),
          },
          {
            name: 'Request',
            value: (
              <div>
                <Tooltip title={item.spec.request}>{item.spec.request.substring(0, 30)}...</Tooltip>
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
            id: 'Status',
            section: item?.status && (
              <SectionBox title="Conditions">
                <SimpleTable
                  columns={[
                    {
                      label: 'Type',
                      getter: item => item.type,
                    },
                    {
                      label: 'Status',
                      getter: item => item.status,
                    },
                    {
                      label: 'Reason',
                      getter: item => item.reason,
                    },
                    {
                      label: 'Message',
                      getter: item => item.message,
                    },
                    {
                      label: 'Last Transition Time',
                      getter: item => item.lastTransitionTime,
                      sort: (a, b) =>
                        new Date(a.lastTransitionTime).getTime() -
                        new Date(b.lastTransitionTime).getTime(),
                    },
                  ]}
                  data={item.status.conditions}
                />
              </SectionBox>
            ),
          },
        ]
      }
    />
  );
}
