import React from 'react';
import { SectionBox, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ResourceTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KafkaUser } from '../crds';

export function KafkaUserList() {
  return (
    <SectionBox title="Kafka Users">
      <ResourceTable
        resourceClass={KafkaUser}
        columns={[
          'name',
          'namespace',
          {
            label: 'Authentication',
            getValue: (user: KafkaUser) => user.spec.authentication.type,
          },
          {
            label: 'Authorization',
            getValue: (user: KafkaUser) => user.spec.authorization?.type || 'None',
          },
          {
            label: 'Status',
            getValue: (user: KafkaUser) => {
              const condition = user.status?.conditions?.find(c => c.type === 'Ready');
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

export function KafkaUserDetails({ name, namespace }: { name: string; namespace: string }) {
  const [user, setUser] = React.useState<KafkaUser | null>(null);

  React.useEffect(() => {
    KafkaUser.useApiGet(setUser, name, namespace);
  }, [name, namespace]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <SectionBox title="Kafka User Details">
        <div>
          <strong>Name:</strong> {user.metadata.name}
        </div>
        <div>
          <strong>Namespace:</strong> {user.metadata.namespace}
        </div>
        <div>
          <strong>Authentication Type:</strong> {user.spec.authentication.type}
        </div>
        <div>
          <strong>Authorization Type:</strong> {user.spec.authorization?.type || 'None'}
        </div>
        <div>
          <strong>Status:</strong>{' '}
          {user.isReady() ? (
            <StatusLabel status="success">Ready</StatusLabel>
          ) : (
            <StatusLabel status="error">Not Ready</StatusLabel>
          )}
        </div>
      </SectionBox>

      {user.spec.authorization?.acls && user.spec.authorization.acls.length > 0 && (
        <SectionBox title="ACLs">
          {user.spec.authorization.acls.map((acl, idx) => (
            <div key={idx} style={{ marginBottom: '10px' }}>
              <div>
                <strong>Resource Type:</strong> {acl.resource.type}
              </div>
              {acl.resource.name && (
                <div>
                  <strong>Resource Name:</strong> {acl.resource.name}
                </div>
              )}
              {acl.operations && (
                <div>
                  <strong>Operations:</strong> {acl.operations.join(', ')}
                </div>
              )}
            </div>
          ))}
        </SectionBox>
      )}

      {user.spec.quotas && (
        <SectionBox title="Quotas">
          {user.spec.quotas.producerByteRate && (
            <div>
              <strong>Producer Byte Rate:</strong> {user.spec.quotas.producerByteRate}
            </div>
          )}
          {user.spec.quotas.consumerByteRate && (
            <div>
              <strong>Consumer Byte Rate:</strong> {user.spec.quotas.consumerByteRate}
            </div>
          )}
          {user.spec.quotas.requestPercentage && (
            <div>
              <strong>Request Percentage:</strong> {user.spec.quotas.requestPercentage}
            </div>
          )}
        </SectionBox>
      )}
    </div>
  );
}
