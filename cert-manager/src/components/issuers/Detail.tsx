import {
  DetailsGrid,
  NameValueTable,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { Issuer } from '../../types/issuer';

export function IssuerDetail() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  return (
    <DetailsGrid
      resourceType={Issuer}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={item =>
        item && [
          {
            name: 'ACME',
            value: (
              <NameValueTable
                rows={[
                  {
                    name: 'Email',
                    value: item.spec.acme.email,
                  },
                  {
                    name: 'Private Key Secret Ref',
                    value: item.spec.acme.privateKeySecretRef.name,
                  },
                  {
                    name: 'Server',
                    value: item.spec.acme.server,
                  },
                  {
                    name: 'Solvers',
                    value: (
                      <NameValueTable
                        rows={[
                          {
                            name: 'http01',
                            value: (
                              <SimpleTable
                                columns={[
                                  {
                                    label: 'Class',
                                    getter: item => item.ingress.class,
                                  },
                                ]}
                                data={[item.spec.acme.solvers[0].http01]}
                              />
                            ),
                          },
                        ]}
                      />
                    ),
                  },
                ]}
              />
            ),
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
                    {
                      name: 'ACME',
                      value: (
                        <NameValueTable
                          rows={[
                            {
                              name: 'Last Private Key Hash',
                              value: item.status.acme.lastPrivateKeyHash,
                            },
                            {
                              name: 'Last Registered Email',
                              value: item.status.acme.lastRegisteredEmail,
                            },
                            {
                              name: 'Uri',
                              value: item.status.acme.uri,
                            },
                          ]}
                        />
                      ),
                    },
                  ]}
                />
              </SectionBox>
            ),
          },
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
