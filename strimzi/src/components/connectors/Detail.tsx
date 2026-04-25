import React from 'react';
import {
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { KafkaConnector } from '../../resources/kafkaConnector';

/**
 * Detail page for a `KafkaConnector` resource.
 *
 * Surfaces the connector's spec (class, tasks, desired state), the
 * Kafka Connect runtime view (`status.connectorStatus`), the connector
 * config as a name/value table, and the standard conditions section.
 */
export function KafkaConnectorDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <DetailsGrid
      resourceType={KafkaConnector}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={item =>
        item
          ? [
              { name: 'Class', value: item.connectorClass || '-' },
              { name: 'Connect cluster', value: item.connectClusterName || '-' },
              { name: 'Tasks max', value: item.tasksMax ?? '-' },
              { name: 'Desired state', value: item.desiredState },
              { name: 'Runtime state', value: item.runtimeState ?? '-' },
              { name: 'Status', value: String(item.readyStatus ?? 'Unknown') },
            ]
          : []
      }
      extraSections={item =>
        item
          ? [
              {
                id: 'config',
                section: (
                  <SectionBox title="Connector configuration">
                    <NameValueTable
                      rows={Object.entries(item.spec?.config ?? {}).map(([key, value]) => ({
                        name: key,
                        value: typeof value === 'string' ? value : JSON.stringify(value),
                      }))}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'tasks',
                section: (
                  <SectionBox title="Tasks">
                    <SimpleTable
                      columns={[
                        { label: 'ID', getter: row => row.id ?? '-' },
                        { label: 'State', getter: row => row.state ?? '-' },
                        { label: 'Worker', getter: row => row.worker_id ?? '-' },
                      ]}
                      data={item.status?.connectorStatus?.tasks ?? []}
                      emptyMessage="No tasks reported by Kafka Connect yet."
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'topics',
                section: (
                  <SectionBox title="Topics">
                    <NameValueTable
                      rows={[
                        {
                          name: 'Topics',
                          value: (item.status?.topics ?? []).join(', ') || '-',
                        },
                      ]}
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
