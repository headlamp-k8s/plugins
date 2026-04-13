import React from 'react';
import { Box, Button, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  DateLabel,
  SectionHeader,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Meta, StoryObj } from '@storybook/react';
import type { KafkaUserInterface } from '../resources/kafkaUser';
import { mockKafkaUsers } from '../storybookMocks/strimziMocks';

function userReadyStatus(u: KafkaUserInterface): string {
  const c = u.status?.conditions?.find(x => x.type === 'Ready');
  return c?.status ?? 'Unknown';
}

function authType(u: KafkaUserInterface): string {
  return u.spec?.authentication?.type ?? '';
}

function authzType(u: KafkaUserInterface): string {
  return u.spec?.authorization?.type ?? 'None';
}

interface PureKafkaUserListProps {
  items: KafkaUserInterface[];
  onViewSecret?: (u: KafkaUserInterface) => void;
  onDelete?: (u: KafkaUserInterface) => void;
}

export function PureKafkaUserList({ items, onViewSecret, onDelete }: PureKafkaUserListProps) {
  const theme = useTheme();

  const statusChip = (u: KafkaUserInterface) => {
    const ready = userReadyStatus(u) === 'True';
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
        title="Kafka Users"
        titleSideActions={[
          <Button key="create" variant="contained" color="primary" size="medium" disabled>
            + Create User
          </Button>,
        ]}
      />
      <SimpleTable
        columns={[
          { label: 'Name', getter: (row: KafkaUserInterface) => row.metadata.name },
          { label: 'Namespace', getter: (row: KafkaUserInterface) => row.metadata.namespace },
          {
            label: 'Authentication',
            getter: (row: KafkaUserInterface) => (
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#9c27b0',
                  color: 'white',
                  fontSize: '11px',
                }}
              >
                {authType(row)}
              </span>
            ),
          },
          { label: 'Authorization', getter: authzType },
          { label: 'Status', getter: (row: KafkaUserInterface) => statusChip(row) },
          {
            label: 'Actions',
            getter: (row: KafkaUserInterface) => (
              <>
                <Button
                  size="small"
                  variant="contained"
                  color="warning"
                  sx={{ mr: 1 }}
                  onClick={() => onViewSecret?.(row)}
                >
                  View Secret
                </Button>
                <Button size="small" variant="contained" color="error" onClick={() => onDelete?.(row)}>
                  Delete
                </Button>
              </>
            ),
          },
          {
            label: 'Age',
            getter: (row: KafkaUserInterface) => (
              <DateLabel date={row.metadata.creationTimestamp} format="mini" />
            ),
          },
        ]}
        data={items}
        emptyMessage="No users found"
      />
    </Box>
  );
}

const meta: Meta<typeof PureKafkaUserList> = {
  title: 'strimzi/KafkaUserList',
  component: PureKafkaUserList,
  argTypes: {
    onViewSecret: { action: 'viewSecret' },
    onDelete: { action: 'delete' },
  },
};
export default meta;

type Story = StoryObj<typeof PureKafkaUserList>;

export const Default: Story = {
  args: { items: mockKafkaUsers },
};

export const Empty: Story = {
  args: { items: [] },
};
