import React from 'react';
import { Link } from 'react-router-dom';
import { SectionBox, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ResourceTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Kafka } from '../crds';

export function KafkaList() {
  return (
    <SectionBox title="Kafka Clusters">
      <ResourceTable
        resourceClass={Kafka}
        columns={[
          'name',
          'namespace',
          {
            label: 'Mode',
            getValue: (kafka: Kafka) => {
              const mode = kafka.getClusterMode();
              return (
                <StatusLabel status={mode === 'KRaft' ? 'success' : 'info'}>
                  {mode}
                </StatusLabel>
              );
            },
          },
          {
            label: 'Kafka Version',
            getValue: (kafka: Kafka) => kafka.spec.kafka.version || 'N/A',
          },
          {
            label: 'Replicas',
            getValue: (kafka: Kafka) => kafka.spec.kafka.replicas,
          },
          {
            label: 'Status',
            getValue: (kafka: Kafka) => {
              const condition = kafka.getReadyCondition();
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

export function KafkaDetails({ name, namespace }: { name: string; namespace: string }) {
  const [kafka, setKafka] = React.useState<Kafka | null>(null);

  React.useEffect(() => {
    Kafka.useApiGet(setKafka, name, namespace);
  }, [name, namespace]);

  if (!kafka) {
    return <div>Loading...</div>;
  }

  const mode = kafka.getClusterMode();
  const isKRaft = kafka.isKRaftMode();

  return (
    <div>
      <SectionBox title="Kafka Cluster Details">
        <div>
          <strong>Name:</strong> {kafka.metadata.name}
        </div>
        <div>
          <strong>Namespace:</strong> {kafka.metadata.namespace}
        </div>
        <div>
          <strong>Mode:</strong>{' '}
          <StatusLabel status={isKRaft ? 'success' : 'info'}>{mode}</StatusLabel>
        </div>
        <div>
          <strong>Version:</strong> {kafka.spec.kafka.version || 'N/A'}
        </div>
        <div>
          <strong>Replicas:</strong> {kafka.spec.kafka.replicas}
        </div>
        <div>
          <strong>Status:</strong>{' '}
          {kafka.isReady() ? (
            <StatusLabel status="success">Ready</StatusLabel>
          ) : (
            <StatusLabel status="error">Not Ready</StatusLabel>
          )}
        </div>
      </SectionBox>

      {isKRaft && (
        <SectionBox title="KRaft Configuration">
          <div>
            <strong>Metadata Version:</strong> {kafka.getMetadataVersion() || 'N/A'}
          </div>
          <div>
            <strong>Description:</strong> This cluster is running in KRaft mode (ZooKeeper-less)
          </div>
        </SectionBox>
      )}

      {!isKRaft && kafka.spec.zookeeper && (
        <SectionBox title="ZooKeeper Configuration">
          <div>
            <strong>Replicas:</strong> {kafka.spec.zookeeper.replicas}
          </div>
          <div>
            <strong>Storage Type:</strong> {kafka.spec.zookeeper.storage.type}
          </div>
          {kafka.spec.zookeeper.storage.size && (
            <div>
              <strong>Storage Size:</strong> {kafka.spec.zookeeper.storage.size}
            </div>
          )}
        </SectionBox>
      )}

      {kafka.status?.listeners && kafka.status.listeners.length > 0 && (
        <SectionBox title="Listeners">
          {kafka.status.listeners.map((listener, idx) => (
            <div key={idx}>
              <strong>{listener.type}:</strong>
              {listener.addresses.map((addr, addrIdx) => (
                <div key={addrIdx} style={{ marginLeft: '20px' }}>
                  {addr.host}:{addr.port}
                </div>
              ))}
            </div>
          ))}
        </SectionBox>
      )}
    </div>
  );
}
