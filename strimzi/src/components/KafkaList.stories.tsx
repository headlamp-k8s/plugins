import React from 'react';
import { Box, Button } from '@mui/material';
import {
  DateLabel,
  SectionHeader,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Meta, StoryObj } from '@storybook/react';
import type { KafkaInterface } from '../resources/kafka';
import { mockKafkaClusters } from '../storybookMocks/strimziMocks';

function kafkaClusterMode(k: KafkaInterface): string {
  return k.spec?.zookeeper ? 'ZooKeeper' : 'KRaft';
}

function kafkaVersion(k: KafkaInterface): string {
  return k.spec?.kafka?.version || 'N/A';
}

function kafkaReplicasDisplay(k: KafkaInterface): string {
  const zk = k.spec?.zookeeper?.replicas;
  const br = k.spec?.kafka?.replicas;
  if (zk !== undefined) return `${zk} Zookeeper / ${br} Kafka`;
  if (br !== undefined) return String(br);
  return 'N/A';
}

function kafkaReady(k: KafkaInterface): string {
  const c = k.status?.conditions?.find(x => x.type === 'Ready');
  return c?.status ?? 'Unknown';
}

interface PureKafkaListProps {
  items: KafkaInterface[];
  onTopologyClick?: (item: KafkaInterface) => void;
}

/** Table-only view for Storybook (no ResourceListView / cluster API). */
export function PureKafkaList({ items, onTopologyClick }: PureKafkaListProps) {
  return (
    <Box>
      <SectionHeader title="Kafka Clusters" />
      <SimpleTable
        columns={[
          { label: 'Name', getter: (row: KafkaInterface) => row.metadata.name },
          { label: 'Namespace', getter: (row: KafkaInterface) => row.metadata.namespace },
          { label: 'Mode', getter: kafkaClusterMode },
          { label: 'Version', getter: kafkaVersion },
          { label: 'Replicas', getter: kafkaReplicasDisplay },
          { label: 'Status', getter: kafkaReady },
          {
            label: 'Topology',
            getter: (row: KafkaInterface) => (
              <Button size="small" variant="outlined" onClick={() => onTopologyClick?.(row)}>
                View
              </Button>
            ),
          },
          {
            label: 'Age',
            getter: (row: KafkaInterface) => (
              <DateLabel date={row.metadata.creationTimestamp} format="mini" />
            ),
          },
        ]}
        data={items}
        emptyMessage="No Kafka clusters found"
      />
    </Box>
  );
}

const meta: Meta<typeof PureKafkaList> = {
  title: 'strimzi/KafkaList',
  component: PureKafkaList,
  argTypes: {
    onTopologyClick: { action: 'topologyClick' },
  },
};
export default meta;

type Story = StoryObj<typeof PureKafkaList>;

export const Default: Story = {
  args: {
    items: mockKafkaClusters,
  },
};

export const Empty: Story = {
  args: {
    items: [],
  },
};
