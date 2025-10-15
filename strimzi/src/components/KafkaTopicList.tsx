import React from 'react';
import { KafkaTopic } from '../crds';
import { isTopicReady } from '../crds';

export function KafkaTopicList() {
  const [topics, setTopics] = React.useState<KafkaTopic[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/apis/kafka.strimzi.io/v1beta2/kafkatopics')
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setTopics(data.items);
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
      <h1>Kafka Topics</h1>
      <p>Strimzi Kafka topics</p>

      {topics.length === 0 ? (
        <p>No Kafka topics found</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Name</th>
              <th style={{ padding: '12px' }}>Namespace</th>
              <th style={{ padding: '12px' }}>Partitions</th>
              <th style={{ padding: '12px' }}>Replicas</th>
              <th style={{ padding: '12px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((topic) => {
              const ready = isTopicReady(topic);

              return (
                <tr key={`${topic.metadata.namespace}/${topic.metadata.name}`} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{topic.metadata.name}</td>
                  <td style={{ padding: '12px' }}>{topic.metadata.namespace}</td>
                  <td style={{ padding: '12px' }}>{topic.spec.partitions || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>{topic.spec.replicas || 'N/A'}</td>
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
