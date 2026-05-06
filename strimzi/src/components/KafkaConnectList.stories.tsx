import React from 'react';
import { Box, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  DateLabel,
  SectionHeader,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Meta, StoryObj } from '@storybook/react';
import type { KafkaConnectInterface } from '../resources/kafkaConnect';
import { mockKafkaConnects } from '../storybookMocks/strimziMocks';

function connectReadyStatus(c: KafkaConnectInterface): string {
  const condition = c.status?.conditions?.find(x => x.type === 'Ready');
  return condition?.status ?? 'Unknown';
}

interface PureKafkaConnectListProps {
  items: KafkaConnectInterface[];
}

/**
 * Storybook-only presentation component for KafkaConnect list rows.
 * Does not call the Kubernetes API; mirrors the columns and chip styling
 * of the production `KafkaConnectList` component so reviewers can poke at
 * it without a cluster.
 */
export function PureKafkaConnectList({ items }: PureKafkaConnectListProps) {
  const theme = useTheme();

  const statusChip = (c: KafkaConnectInterface) => {
    const status = connectReadyStatus(c);
    const ready = status === 'True';
    const unknown = status === 'Unknown';
    return (
      <Chip
        label={ready ? 'Ready' : unknown ? 'Unknown' : 'Not Ready'}
        variant={theme.palette.mode === 'dark' ? 'outlined' : 'filled'}
        size="medium"
        color={ready ? 'success' : unknown ? 'default' : 'warning'}
        sx={{ borderRadius: '4px' }}
      />
    );
  };

  return (
    <Box>
      <SectionHeader title="Kafka Connect Clusters" />
      <SimpleTable
        columns={[
          { label: 'Name', getter: row => row.metadata.name },
          { label: 'Namespace', getter: row => row.metadata.namespace },
          { label: 'Version', getter: row => row.spec?.version ?? 'N/A' },
          { label: 'Replicas', getter: row => row.spec?.replicas ?? 0 },
          { label: 'Bootstrap servers', getter: row => row.spec?.bootstrapServers ?? '-' },
          { label: 'Plugins', getter: row => row.status?.connectorPlugins?.length ?? 0 },
          { label: 'Status', getter: statusChip },
          {
            label: 'Age',
            getter: row => <DateLabel date={row.metadata.creationTimestamp} format="mini" />,
          },
        ]}
        data={items}
        emptyMessage="No Kafka Connect clusters found"
      />
    </Box>
  );
}

const meta: Meta<typeof PureKafkaConnectList> = {
  title: 'strimzi/KafkaConnectList',
  component: PureKafkaConnectList,
};
export default meta;

type Story = StoryObj<typeof PureKafkaConnectList>;

export const Default: Story = {
  args: { items: mockKafkaConnects },
};

export const Empty: Story = {
  args: { items: [] },
};
