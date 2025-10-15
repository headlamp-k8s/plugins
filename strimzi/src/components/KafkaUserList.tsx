import React from 'react';
import { KafkaUser } from '../crds';
import { isUserReady } from '../crds';

export function KafkaUserList() {
  const [users, setUsers] = React.useState<KafkaUser[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/apis/kafka.strimzi.io/v1beta2/kafkausers')
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setUsers(data.items);
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
      <h1>Kafka Users</h1>
      <p>Strimzi Kafka users</p>

      {users.length === 0 ? (
        <p>No Kafka users found</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Name</th>
              <th style={{ padding: '12px' }}>Namespace</th>
              <th style={{ padding: '12px' }}>Authentication</th>
              <th style={{ padding: '12px' }}>Authorization</th>
              <th style={{ padding: '12px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const ready = isUserReady(user);

              return (
                <tr key={`${user.metadata.namespace}/${user.metadata.name}`} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{user.metadata.name}</td>
                  <td style={{ padding: '12px' }}>{user.metadata.namespace}</td>
                  <td style={{ padding: '12px' }}>{user.spec.authentication.type}</td>
                  <td style={{ padding: '12px' }}>{user.spec.authorization?.type || 'None'}</td>
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
