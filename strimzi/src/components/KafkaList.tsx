import React from 'react';
import { ApiError, Kafka as K8sKafka } from '../crds';
import { getClusterMode, isKRaftMode, isKafkaReady } from '../crds';

export function KafkaList() {
  const [kafkas, setKafkas] = React.useState<K8sKafka[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Fetch Kafka resources from Kubernetes API
    fetch('/apis/kafka.strimzi.io/v1beta2/kafkas')
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setKafkas(data.items);
        }
      })
      .catch(err => {
        setError(err.message);
      });
  }, []);

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Kafka Clusters</h1>
      <p>Strimzi Kafka clusters with KRaft and ZooKeeper support</p>

      {kafkas.length === 0 ? (
        <p>No Kafka clusters found</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Name</th>
              <th style={{ padding: '12px' }}>Namespace</th>
              <th style={{ padding: '12px' }}>Mode</th>
              <th style={{ padding: '12px' }}>Version</th>
              <th style={{ padding: '12px' }}>Replicas</th>
              <th style={{ padding: '12px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {kafkas.map((kafka) => {
              const mode = getClusterMode(kafka);
              const isKRaft = isKRaftMode(kafka);
              const ready = isKafkaReady(kafka);

              return (
                <tr key={`${kafka.metadata.namespace}/${kafka.metadata.name}`} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{kafka.metadata.name}</td>
                  <td style={{ padding: '12px' }}>{kafka.metadata.namespace}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: isKRaft ? '#4caf50' : '#2196f3',
                      color: 'white',
                      fontSize: '12px'
                    }}>
                      {mode}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{kafka.spec.kafka.version || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>{kafka.spec.kafka.replicas}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: ready ? '#4caf50' : '#ff9800',
                      color: 'white',
                      fontSize: '12px'
                    }}>
                      {ready ? 'Ready' : 'Not Ready'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
