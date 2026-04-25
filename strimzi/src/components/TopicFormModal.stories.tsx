import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TopicFormModal, type TopicFormData } from './TopicFormModal';

const mockClusters = [
  { metadata: { namespace: 'kafka', name: 'test-cluster' } },
  { metadata: { namespace: 'kafka', name: 'other-cluster' } },
  { metadata: { namespace: 'default', name: 'demo-kafka' } },
];

function TopicModalHarness({ isEdit }: { isEdit: boolean }) {
  const [formData, setFormData] = React.useState<TopicFormData>(() =>
    isEdit
      ? {
          name: 'headlamp-demo-basic',
          namespace: 'kafka',
          cluster: 'test-cluster',
          partitions: 3,
          replicas: 1,
          retentionMs: 7200000,
          compressionType: 'snappy',
        }
      : {
          name: 'new-topic',
          namespace: 'kafka',
          cluster: 'test-cluster',
          partitions: 3,
          replicas: 1,
          retentionMs: 7200000,
          compressionType: 'snappy',
        }
  );

  const availableNamespacesForCreate = ['default', 'kafka'];
  const filteredClusterNames = React.useMemo(() => {
    if (!formData.namespace) return [];
    return mockClusters
      .filter(k => k.metadata.namespace === formData.namespace)
      .map(k => k.metadata.name)
      .sort();
  }, [formData.namespace]);

  return (
    <TopicFormModal
      open
      isEdit={isEdit}
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
  title: 'strimzi/TopicFormModal',
  parameters: {
    docs: {
      description: {
        component:
          'Create / edit Kafka topic modal (same component as KafkaTopicList). Use dark background toolbar to check primary button contrast.',
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const CreateTopic: Story = {
  render: () => <TopicModalHarness isEdit={false} />,
};

export const EditTopic: Story = {
  render: () => <TopicModalHarness isEdit />,
};

export const SubmitLoading: Story = {
  render: function SubmitLoadingStory() {
    const [formData, setFormData] = React.useState<TopicFormData>({
      name: 'saving-topic',
      namespace: 'kafka',
      cluster: 'test-cluster',
      partitions: 3,
      replicas: 1,
    });
    const filteredClusterNames = ['test-cluster', 'other-cluster'];
    return (
      <TopicFormModal
        open
        isEdit={false}
        loading
        formData={formData}
        setFormData={setFormData}
        kafkaClusters={mockClusters}
        availableNamespacesForCreate={['kafka']}
        filteredClusterNames={filteredClusterNames}
        onCancel={() => {}}
        onSubmit={() => {}}
      />
    );
  },
};
