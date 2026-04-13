import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { KafkaUserCreateFormModal, type UserFormData } from './KafkaUserCreateFormModal';

const mockClusters = [
  { metadata: { namespace: 'kafka', name: 'test-cluster' } },
  { metadata: { namespace: 'kafka', name: 'other-cluster' } },
  { metadata: { namespace: 'default', name: 'demo-kafka' } },
];

function UserModalHarness({ withAcls }: { withAcls: boolean }) {
  const [formData, setFormData] = React.useState<UserFormData>({
    name: 'demo-user',
    namespace: 'kafka',
    cluster: 'test-cluster',
    authenticationType: 'scram-sha-512',
    authorizationType: withAcls ? 'simple' : 'none',
    acls: withAcls
      ? [
          {
            resource: { type: 'topic', name: 'my-topic', patternType: 'literal' },
            operations: ['Read', 'Write'],
            host: '*',
          },
        ]
      : [],
  });

  const availableNamespacesForCreate = ['default', 'kafka'];
  const filteredClusterNames = React.useMemo(() => {
    if (!formData.namespace) return [];
    return mockClusters
      .filter(k => k.metadata.namespace === formData.namespace)
      .map(k => k.metadata.name)
      .sort();
  }, [formData.namespace]);

  return (
    <KafkaUserCreateFormModal
      open
      loading={false}
      formData={formData}
      setFormData={setFormData}
      kafkaClusters={mockClusters}
      availableNamespacesForCreate={availableNamespacesForCreate}
      filteredClusterNames={filteredClusterNames}
      onCancel={() => {}}
      onSubmit={() => {}}
    />
  );
}

const meta: Meta = {
  title: 'strimzi/KafkaUserCreateFormModal',
  parameters: {
    docs: {
      description: {
        component:
          'Create Kafka user modal (same component as KafkaUserList). Toggle Storybook dark background to verify button labels.',
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const CreateUser: Story = {
  render: () => <UserModalHarness withAcls={false} />,
};

export const WithSimpleAuthAndAcls: Story = {
  render: () => <UserModalHarness withAcls />,
};

export const TlsAuth: Story = {
  render: function TlsAuthStory() {
    const [formData, setFormData] = React.useState<UserFormData>({
      name: 'tls-user',
      namespace: 'kafka',
      cluster: 'test-cluster',
      authenticationType: 'tls',
      authorizationType: 'none',
      acls: [],
    });
    return (
      <KafkaUserCreateFormModal
        open
        loading={false}
        formData={formData}
        setFormData={setFormData}
        kafkaClusters={mockClusters}
        availableNamespacesForCreate={['kafka']}
        filteredClusterNames={['test-cluster', 'other-cluster']}
        onCancel={() => {}}
        onSubmit={() => {}}
      />
    );
  },
};
