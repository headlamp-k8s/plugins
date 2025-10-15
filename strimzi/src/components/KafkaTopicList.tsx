import React from 'react';
import { SectionBox, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ResourceTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KafkaTopic } from '../crds';

export function KafkaTopicList() {
  return (
    <SectionBox title="Kafka Topics">
      <ResourceTable
        resourceClass={KafkaTopic}
        columns={[
          'name',
          'namespace',
          {
            label: 'Partitions',
            getValue: (topic: KafkaTopic) => topic.spec.partitions || 'N/A',
          },
          {
            label: 'Replicas',
            getValue: (topic: KafkaTopic) => topic.spec.replicas || 'N/A',
          },
          {
            label: 'Status',
            getValue: (topic: KafkaTopic) => {
              const condition = topic.status?.conditions?.find(c => c.type === 'Ready');
              return (
                <StatusLabel
                  status={condition?.status === 'True' ? 'success' : 'error'}
                >
                  {condition?.status === 'True' ? 'Ready' : condition?.reason || 'Unknown'}
                </StatusLabel>
              );
            },
          },
          'age',
        ]}
      />
    </SectionBox>
  );
}

export function KafkaTopicDetails({ name, namespace }: { name: string; namespace: string }) {
  const [topic, setTopic] = React.useState<KafkaTopic | null>(null);

  React.useEffect(() => {
    KafkaTopic.useApiGet(setTopic, name, namespace);
  }, [name, namespace]);

  if (!topic) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <SectionBox title="Kafka Topic Details">
        <div>
          <strong>Name:</strong> {topic.metadata.name}
        </div>
        <div>
          <strong>Namespace:</strong> {topic.metadata.namespace}
        </div>
        <div>
          <strong>Partitions:</strong> {topic.spec.partitions || 'N/A'}
        </div>
        <div>
          <strong>Replicas:</strong> {topic.spec.replicas || 'N/A'}
        </div>
        <div>
          <strong>Status:</strong>{' '}
          {topic.isReady() ? (
            <StatusLabel status="success">Ready</StatusLabel>
          ) : (
            <StatusLabel status="error">Not Ready</StatusLabel>
          )}
        </div>
      </SectionBox>

      {topic.spec.config && Object.keys(topic.spec.config).length > 0 && (
        <SectionBox title="Configuration">
          {Object.entries(topic.spec.config).map(([key, value]) => (
            <div key={key}>
              <strong>{key}:</strong> {String(value)}
            </div>
          ))}
        </SectionBox>
      )}
    </div>
  );
}
