import {
  DetailsGrid,
  LabelListItem,
  Link,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { Certificate } from '../../types/certificate';

export function CertificateDetail() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();
  return (
    <DetailsGrid
      resourceType={Certificate}
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
            name: 'Common Name',
            value: item.spec.commonName,
          },
          {
            name: 'DNS Names',
            value: item.spec.dnsNames.map(dnsName => (
              <div style={{ marginBottom: '10px' }}>
                <LabelListItem labels={[dnsName]} />
              </div>
            )),
          },
          {
            name: 'Duration',
            value: item.spec.duration,
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
            name: 'Renew Before',
            value: item.spec.renewBefore,
          },
          {
            name: 'Secret Name',
            value: item.spec.secretName,
          },
          {
            name: 'Subject',
            value: item.spec.subject && (
              <NameValueTable
                rows={[
                  {
                    name: 'Organizations',
                    value:
                      item.organizations &&
                      item.organizations.map(org => (
                        <div style={{ marginBottom: '10px' }}>
                          <LabelListItem labels={[org]} />
                        </div>
                      )),
                  },
                ]}
              />
            ),
          },
          {
            name: 'Next Private Key Secret',
            value: item.status.nextPrivateKeySecretName,
          },
        ]
      }
      extraSections={item =>
        item && [
          {
            id: 'Conditions',
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
                      label: 'Observed Generation',
                      getter: item => item.observedGeneration,
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
