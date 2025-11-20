import React from 'react';
import { useParams } from 'react-router-dom';
import { Kafka, isKafkaReady, getClusterMode } from '../crds';
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { KafkaClusterTopology } from './KafkaClusterTopology';

export function KafkaDetails() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const [kafka, setKafka] = React.useState<Kafka | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!namespace || !name) {
      setError('Missing namespace or name parameter');
      setLoading(false);
      return;
    }

    ApiProxy.request(`/apis/kafka.strimzi.io/v1beta2/namespaces/${namespace}/kafkas/${name}`)
      .then((data: Kafka) => {
        setKafka(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [namespace, name]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
        Loading cluster details...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#dc2626', textAlign: 'center' }}>Error: {error}</div>
    );
  }

  if (!kafka) {
    return (
      <div style={{ padding: '20px', color: '#64748b', textAlign: 'center' }}>
        Cluster not found
      </div>
    );
  }

  const ready = isKafkaReady(kafka);
  const mode = getClusterMode(kafka);

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
              {kafka.metadata.name}
            </h1>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
              Namespace: {kafka.metadata.namespace}
            </p>
          </div>
          <div
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: ready ? '#d1fae5' : '#fee2e2',
              color: ready ? '#059669' : '#dc2626',
            }}
          >
            {ready ? '✓ Ready' : '✗ Not Ready'}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginTop: '24px',
          }}
        >
          <div>
            <div
              style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}
            >
              MODE
            </div>
            <div
              style={{
                display: 'inline-block',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: mode === 'KRaft' ? '#d1fae5' : '#dbeafe',
                color: mode === 'KRaft' ? '#059669' : '#2563eb',
              }}
            >
              {mode}
            </div>
          </div>

          <div>
            <div
              style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}
            >
              VERSION
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
              {kafka.spec.kafka.version || 'N/A'}
            </div>
          </div>

          <div>
            <div
              style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}
            >
              KAFKA REPLICAS
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
              {kafka.spec.kafka.replicas}
            </div>
          </div>

          {kafka.spec.zookeeper && (
            <div>
              <div
                style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}
              >
                ZOOKEEPER REPLICAS
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
                {kafka.spec.zookeeper.replicas}
              </div>
            </div>
          )}

          {kafka.status?.clusterId && (
            <div>
              <div
                style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}
              >
                CLUSTER ID
              </div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#64748b',
                  fontFamily: 'monospace',
                }}
              >
                {kafka.status.clusterId}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Topology */}
      <div
        style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        <h2
          style={{
            margin: '0 0 16px 0',
            fontSize: '20px',
            fontWeight: 700,
            color: '#1e293b',
          }}
        >
          Cluster Topology
        </h2>
        <KafkaClusterTopology kafka={kafka} />
      </div>
    </div>
  );
}
