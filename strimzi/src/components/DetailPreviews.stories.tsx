/**
 * Static previews of detail-page sections (no DetailsGrid / cluster API).
 * Full detail views with live data: run Headlamp with the Strimzi plugin.
 */
import React from 'react';
import { Box, Typography } from '@mui/material';
import { NameValueTable, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Meta, StoryObj } from '@storybook/react';
import { mockKafkaClusters, mockKafkaTopics, mockKafkaUsers } from '../storybookMocks/strimziMocks';

function kafkaClusterMode(k: (typeof mockKafkaClusters)[0]): string {
  return k.spec?.zookeeper ? 'ZooKeeper' : 'KRaft';
}

function kafkaReplicasDisplay(k: (typeof mockKafkaClusters)[0]): string {
  const zk = k.spec?.zookeeper?.replicas;
  const br = k.spec?.kafka?.replicas;
  if (zk !== undefined) return `${zk} Zookeeper / ${br} Kafka`;
  if (br !== undefined) return String(br);
  return 'N/A';
}

function kafkaReady(k: (typeof mockKafkaClusters)[0]): string {
  const c = k.status?.conditions?.find(x => x.type === 'Ready');
  return c?.status ?? 'Unknown';
}

function KafkaClusterDetailPreview() {
  const item = mockKafkaClusters[0];
  return (
    <Box sx={{ p: 2, maxWidth: 720 }}>
      <Typography variant="h6" gutterBottom>
        Kafka cluster (preview)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {item.metadata.namespace} / {item.metadata.name}
      </Typography>
      <SectionBox title="Overview">
        <NameValueTable
          rows={[
            { name: 'Mode', value: kafkaClusterMode(item) },
            { name: 'Kafka Version', value: item.spec?.kafka?.version ?? 'N/A' },
            { name: 'Replicas', value: kafkaReplicasDisplay(item) },
            { name: 'Status', value: kafkaReady(item) },
          ]}
        />
      </SectionBox>
      <SectionBox title="Spec">
        <NameValueTable
          rows={[
            { name: 'Kafka replicas', value: item.spec?.kafka?.replicas ?? '-' },
            { name: 'ZooKeeper replicas', value: item.spec?.zookeeper?.replicas ?? '-' },
          ]}
        />
      </SectionBox>
    </Box>
  );
}

function KafkaTopicDetailPreview() {
  const item = mockKafkaTopics[0];
  const ready = item.status?.conditions?.find(c => c.type === 'Ready')?.status ?? 'Unknown';
  return (
    <Box sx={{ p: 2, maxWidth: 720 }}>
      <Typography variant="h6" gutterBottom>
        Kafka topic (preview)
      </Typography>
      <SectionBox title="Overview">
        <NameValueTable
          rows={[
            { name: 'Cluster', value: item.metadata.labels?.['strimzi.io/cluster'] ?? '-' },
            { name: 'Partitions', value: item.spec?.partitions ?? '-' },
            { name: 'Replicas', value: item.spec?.replicas ?? '-' },
            { name: 'Ready', value: ready },
          ]}
        />
      </SectionBox>
    </Box>
  );
}

function KafkaUserDetailPreview() {
  const item = mockKafkaUsers[0];
  const ready = item.status?.conditions?.find(c => c.type === 'Ready')?.status ?? 'Unknown';
  return (
    <Box sx={{ p: 2, maxWidth: 720 }}>
      <Typography variant="h6" gutterBottom>
        Kafka user (preview)
      </Typography>
      <SectionBox title="Overview">
        <NameValueTable
          rows={[
            { name: 'Cluster', value: item.metadata.labels?.['strimzi.io/cluster'] ?? '-' },
            { name: 'Authentication', value: item.spec.authentication.type },
            { name: 'Authorization', value: item.spec.authorization?.type ?? 'None' },
            { name: 'Ready', value: ready },
          ]}
        />
      </SectionBox>
    </Box>
  );
}

const meta: Meta = {
  title: 'strimzi/DetailPreviews',
  parameters: {
    docs: {
      description: {
        component:
          'Mirrors fields shown on real detail pages. Events, YAML, and ConditionsSection require Headlamp.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const KafkaCluster: Story = {
  render: () => <KafkaClusterDetailPreview />,
};

export const KafkaTopic: Story = {
  render: () => <KafkaTopicDetailPreview />,
};

export const KafkaUser: Story = {
  render: () => <KafkaUserDetailPreview />,
};
