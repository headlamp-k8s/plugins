import React from 'react';
import {
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { KafkaConnect } from '../../resources/kafkaConnect';

/**
 * Detail page for a single `KafkaConnect` resource.
 *
 * Surfaces the spec summary, status conditions, and the connector plugins
 * discovered by the operator on the workers (so users can confirm a plugin
 * is actually loaded before creating a `KafkaConnector` against it).
 */
export function KafkaConnectDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <DetailsGrid
      resourceType={KafkaConnect}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={item =>
        item
          ? [
              { name: 'Version', value: item.connectVersion },
              { name: 'Replicas', value: item.replicas },
              { name: 'Bootstrap servers', value: item.bootstrapServers || '-' },
              { name: 'Connect URL', value: item.connectUrl || '-' },
              { name: 'Status', value: String(item.readyStatus ?? 'Unknown') },
            ]
          : []
      }
      extraSections={item =>
        item
          ? [
              {
                id: 'spec',
                section: (
                  <SectionBox title="Spec">
                    <NameValueTable
                      rows={[
                        { name: 'Image', value: item.spec?.image ?? '-' },
                        {
                          name: 'Authentication',
                          value: item.spec?.authentication?.type ?? 'None',
                        },
                        {
                          name: 'TLS trusted certs',
                          value: item.spec?.tls?.trustedCertificates?.length ?? 0,
                        },
                      ]}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'plugins',
                section: (
                  <SectionBox title="Connector plugins">
                    <SimpleTable
                      columns={[
                        { label: 'Class', getter: row => row.class },
                        { label: 'Type', getter: row => row.type ?? '-' },
                        { label: 'Version', getter: row => row.version ?? '-' },
                      ]}
                      data={item.connectorPlugins}
                      emptyMessage="No connector plugins reported by the operator yet."
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'conditions',
                section: <ConditionsSection resource={item?.jsonData} />,
              },
            ]
          : []
      }
    />
  );
}
