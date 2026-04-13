import React from 'react';
import { Box, Button, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  DateLabel,
  SectionHeader,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Meta, StoryObj } from '@storybook/react';
import type { KafkaTopicInterface } from '../resources/kafkaTopic';
import { mockKafkaTopics } from '../storybookMocks/strimziMocks';

function topicReadyStatus(t: KafkaTopicInterface): string {
  const c = t.status?.conditions?.find(x => x.type === 'Ready');
  return c?.status ?? 'Unknown';
}

interface PureKafkaTopicListProps {
  items: KafkaTopicInterface[];
  onEdit?: (t: KafkaTopicInterface) => void;
  onDelete?: (t: KafkaTopicInterface) => void;
}

export function PureKafkaTopicList({ items, onEdit, onDelete }: PureKafkaTopicListProps) {
  const theme = useTheme();

  const statusChip = (t: KafkaTopicInterface) => {
    const ready = topicReadyStatus(t) === 'True';
    return (
      <Chip
        label={ready ? 'Ready' : 'Not Ready'}
        variant={theme.palette.mode === 'dark' ? 'outlined' : 'filled'}
        size="medium"
        color={ready ? 'success' : 'warning'}
        sx={{
          borderRadius: '4px',
          ...(theme.palette.mode === 'dark' &&
            ready && {
              borderColor: '#34d399',
              color: '#34d399',
              backgroundColor: 'rgba(52, 211, 153, 0.15)',
            }),
          ...(theme.palette.mode === 'dark' &&
            !ready && {
              borderColor: '#f87171',
              color: '#f87171',
              backgroundColor: 'rgba(248, 113, 113, 0.15)',
            }),
        }}
      />
    );
  };

  return (
    <Box>
      <SectionHeader
        title="Kafka Topics"
        titleSideActions={[
          <Button key="create" variant="contained" color="primary" size="medium" disabled>
            + Create Topic
          </Button>,
        ]}
      />
      <SimpleTable
        columns={[
          { label: 'Name', getter: (row: KafkaTopicInterface) => row.metadata.name },
          { label: 'Namespace', getter: (row: KafkaTopicInterface) => row.metadata.namespace },
          { label: 'Partitions', getter: (row: KafkaTopicInterface) => row.spec?.partitions ?? 0 },
          { label: 'Replicas', getter: (row: KafkaTopicInterface) => row.spec?.replicas ?? 0 },
          { label: 'Status', getter: (row: KafkaTopicInterface) => statusChip(row) },
          {
            label: 'Actions',
            getter: (row: KafkaTopicInterface) => (
              <>
                <Button size="small" variant="contained" color="primary" sx={{ mr: 1 }} onClick={() => onEdit?.(row)}>
                  Edit
                </Button>
                <Button size="small" variant="contained" color="error" onClick={() => onDelete?.(row)}>
                  Delete
                </Button>
              </>
            ),
          },
          {
            label: 'Age',
            getter: (row: KafkaTopicInterface) => (
              <DateLabel date={row.metadata.creationTimestamp} format="mini" />
            ),
          },
        ]}
        data={items}
        emptyMessage="No topics found"
      />
    </Box>
  );
}

const meta: Meta<typeof PureKafkaTopicList> = {
  title: 'strimzi/KafkaTopicList',
  component: PureKafkaTopicList,
  argTypes: {
    onEdit: { action: 'edit' },
    onDelete: { action: 'delete' },
  },
};
export default meta;

type Story = StoryObj<typeof PureKafkaTopicList>;

export const Default: Story = {
  args: { items: mockKafkaTopics },
};

export const Empty: Story = {
  args: { items: [] },
};
