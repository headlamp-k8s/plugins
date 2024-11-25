import { Icon } from '@iconify/react';
import {
  DetailsGrid,
  Link,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { IconButton, Tooltip } from '@mui/material';
import { useParams } from 'react-router-dom';
import { Challenge } from '../../types/challenge';

export function ChallengeDetail() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  return (
    <DetailsGrid
      resourceType={Challenge}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={item =>
        item && [
          {
            name: 'DNS Name',
            value: item.spec.dnsName,
          },
          {
            name: 'Authorization URL',
            value: item.spec.authorizationURL,
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
                  { name: 'Kind', value: item.spec.issuerRef.kind },
                ]}
              />
            ),
          },
          {
            name: 'Key',
            value: (
              <div>
                <Tooltip title={item.spec.key}>{item.spec.key.substring(0, 30)}...</Tooltip>
                <IconButton
                  onClick={() => {
                    navigator.clipboard.writeText(item.spec.key);
                  }}
                >
                  <Icon icon="mdi:content-copy" />
                </IconButton>
              </div>
            ),
          },
          {
            name: 'Solver',
            value: item.spec.solver && (
              <NameValueTable
                rows={[
                  {
                    name: 'http01',
                    value: item.spec.solver.http01 && (
                      <SimpleTable
                        columns={[
                          {
                            label: 'Class',
                            getter: item => item.ingress.class,
                          },
                        ]}
                        data={[item.spec.solver.http01]}
                      />
                    ),
                  },
                ]}
              />
            ),
          },
          {
            name: 'Token',
            value: item.spec.token,
          },
          {
            name: 'URL',
            value: item.spec.url,
          },
          {
            name: 'Wildcard',
            value: item.spec.wildcard.toString(),
          },
        ]
      }
      extraSections={item =>
        item && [
          {
            id: 'Status',
            section: item?.status && (
              <SectionBox title="Status">
                <NameValueTable
                  rows={[
                    { name: 'State', value: item.status.state },
                    { name: 'Presented', value: item.status.presented.toString() },
                    { name: 'Processing', value: item.status.processing.toString() },
                    { name: 'Reason', value: item.status.reason },
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
