import React from 'react';
import { Box, Button, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  DateLabel,
  SectionHeader,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Meta, StoryObj } from '@storybook/react';
import type {
  KafkaConnectorInterface,
  KafkaConnectorState,
} from '../resources/kafkaConnector';
import { getConnectorDesiredState } from '../crds-helpers';
import { mockKafkaConnectors } from '../storybookMocks/strimziMocks';

function connectorReadyStatus(c: KafkaConnectorInterface): string {
  const condition = c.status?.conditions?.find(x => x.type === 'Ready');
  return condition?.status ?? 'Unknown';
}

const STATE_CHIP_COLORS: Record<KafkaConnectorState, 'success' | 'warning' | 'default'> = {
  running: 'success',
  paused: 'warning',
  stopped: 'default',
};

interface PureKafkaConnectorListProps {
  items: KafkaConnectorInterface[];
  onTogglePause?: (c: KafkaConnectorInterface, target: KafkaConnectorState) => void;
}

/**
 * Storybook-only presentation component for KafkaConnector list rows.
 * Mirrors the production list's pause/resume action so reviewers can
 * exercise the desired-vs-runtime state UX without a cluster.
 */
export function PureKafkaConnectorList({ items, onTogglePause }: PureKafkaConnectorListProps) {
  const theme = useTheme();

  const stateChip = (state: KafkaConnectorState) => (
    <Chip
      label={state}
      variant={theme.palette.mode === 'dark' ? 'outlined' : 'filled'}
      size="small"
      color={STATE_CHIP_COLORS[state]}
      sx={{ borderRadius: '4px', textTransform: 'capitalize' }}
    />
  );

  const statusChip = (c: KafkaConnectorInterface) => {
    const status = connectorReadyStatus(c);
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

  const action = (c: KafkaConnectorInterface) => {
    const desired = getConnectorDesiredState(c);
    if (desired === 'paused') {
      return (
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={() => onTogglePause?.(c, 'running')}
        >
          Resume
        </Button>
      );
    }
    if (desired === 'running') {
      return (
        <Button
          size="small"
          variant="contained"
          color="warning"
          onClick={() => onTogglePause?.(c, 'paused')}
        >
          Pause
        </Button>
      );
    }
    return (
      <Button
        size="small"
        variant="contained"
        color="primary"
        onClick={() => onTogglePause?.(c, 'running')}
      >
        Start
      </Button>
    );
  };

  return (
    <Box>
      <SectionHeader title="Kafka Connectors" />
      <SimpleTable
        columns={[
          { label: 'Name', getter: row => row.metadata.name },
          { label: 'Namespace', getter: row => row.metadata.namespace },
          {
            label: 'Connect cluster',
            getter: row => row.metadata.labels?.['strimzi.io/cluster'] ?? '-',
          },
          { label: 'Class', getter: row => row.spec?.class ?? '-' },
          { label: 'Tasks max', getter: row => row.spec?.tasksMax ?? '-' },
          {
            label: 'Desired state',
            getter: row => stateChip(getConnectorDesiredState(row)),
          },
          {
            label: 'Runtime state',
            getter: row =>
              row.status?.connectorStatus?.connector?.state?.toLowerCase() ?? '-',
          },
          { label: 'Status', getter: statusChip },
          { label: 'Actions', getter: action },
          {
            label: 'Age',
            getter: row => <DateLabel date={row.metadata.creationTimestamp} format="mini" />,
          },
        ]}
        data={items}
        emptyMessage="No Kafka Connectors found"
      />
    </Box>
  );
}

const meta: Meta<typeof PureKafkaConnectorList> = {
  title: 'strimzi/KafkaConnectorList',
  component: PureKafkaConnectorList,
  argTypes: {
    onTogglePause: { action: 'togglePause' },
  },
};
export default meta;

type Story = StoryObj<typeof PureKafkaConnectorList>;

export const Default: Story = {
  args: { items: mockKafkaConnectors },
};

export const Empty: Story = {
  args: { items: [] },
};

export const RunningOnly: Story = {
  args: { items: mockKafkaConnectors.filter(c => c.spec?.state !== 'paused') },
};

export const PausedOnly: Story = {
  args: { items: mockKafkaConnectors.filter(c => c.spec?.state === 'paused') },
};
