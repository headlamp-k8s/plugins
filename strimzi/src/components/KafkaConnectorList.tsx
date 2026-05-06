import React from 'react';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import {
  ResourceListView,
  type ColumnType,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KafkaConnector, KafkaConnectorV1 } from '../resources/kafkaConnector';
import type { KafkaConnectorInterface, KafkaConnectorState } from '../resources/kafkaConnector';
import { getErrorMessage } from '../utils/errors';
import { useStrimziApiVersions } from '../hooks/useStrimziApiVersions';
import { StrimziNotInstalledMessage } from './StrimziNotInstalledMessage';
import { readyChipProps } from '../utils/readyChip';
import { Toast, ToastMessage } from './Toast';

const STATE_CHIP_COLORS: Record<KafkaConnectorState, 'success' | 'warning' | 'default'> = {
  running: 'success',
  paused: 'warning',
  stopped: 'default',
};

/**
 * List view for `KafkaConnector` resources.
 *
 * Shows the desired state from the spec (the user-controlled column) and
 * the runtime state from `status.connectorStatus.connector.state` (what
 * Kafka Connect is actually doing). Pause / Resume actions are
 * single-field PATCHes against `spec.state` so they remain safe even on
 * connectors authored as YAML elsewhere.
 */
export function KafkaConnectorList() {
  const theme = useTheme();
  const { ready, installed, kafka: kafkaVersion } = useStrimziApiVersions();
  const KafkaConnectorClass = kafkaVersion === 'v1' ? KafkaConnectorV1 : KafkaConnector;

  if (ready && !installed) return <StrimziNotInstalledMessage />;

  const [toast, setToast] = React.useState<ToastMessage | null>(null);
  const [pendingState, setPendingState] = React.useState<{
    connector: KafkaConnectorInterface;
    targetState: KafkaConnectorState;
  } | null>(null);

  const patchState = async (
    connector: KafkaConnectorInterface,
    targetState: KafkaConnectorState
  ) => {
    const path = `/apis/kafka.strimzi.io/${kafkaVersion}/namespaces/${connector.metadata.namespace}/kafkaconnectors/${connector.metadata.name}`;
    try {
      await ApiProxy.request(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/merge-patch+json' },
        body: JSON.stringify({ spec: { state: targetState } }),
      });
      setToast({
        message: `Connector "${connector.metadata.name}" set to ${targetState}`,
        type: 'success',
      });
    } catch (err: unknown) {
      setToast({
        message: getErrorMessage(err) || `Failed to set connector to ${targetState}`,
        type: 'error',
      });
    }
  };

  const confirmStateChange = async () => {
    if (!pendingState) return;
    const { connector, targetState } = pendingState;
    setPendingState(null);
    await patchState(connector, targetState);
  };

  const stateChip = (state: KafkaConnectorState) => (
    <Chip
      label={state}
      variant={theme.palette.mode === 'dark' ? 'outlined' : 'filled'}
      size="small"
      color={STATE_CHIP_COLORS[state]}
      sx={{ borderRadius: '4px', textTransform: 'capitalize' }}
    />
  );

  const columns: (ColumnType | ResourceTableColumn<KafkaConnector>)[] = [
    'name',
    'namespace',
    {
      id: 'cluster',
      label: 'Connect cluster',
      getValue: (item: KafkaConnector) => item.connectClusterName || '-',
    },
    {
      id: 'class',
      label: 'Class',
      getValue: (item: KafkaConnector) => item.connectorClass,
    },
    {
      id: 'tasks',
      label: 'Tasks max',
      getValue: (item: KafkaConnector) => item.tasksMax ?? '-',
    },
    {
      id: 'desired',
      label: 'Desired state',
      getValue: (item: KafkaConnector) => item.desiredState,
      render: (item: KafkaConnector) => stateChip(item.desiredState),
    },
    {
      id: 'runtime',
      label: 'Runtime state',
      getValue: (item: KafkaConnector) => item.runtimeState ?? '-',
    },
    {
      id: 'status',
      label: 'Status',
      getValue: (item: KafkaConnector) => String(item.readyStatus ?? 'Unknown'),
      render: (item: KafkaConnector) => {
        const { label, color } = readyChipProps(item.readyStatus);
        return (
          <Chip
            label={label}
            variant={theme.palette.mode === 'dark' ? 'outlined' : 'filled'}
            size="medium"
            color={color}
            sx={{ borderRadius: '4px' }}
          />
        );
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      getValue: () => '',
      render: (item: KafkaConnector) => {
        const desired = item.desiredState;
        if (desired === 'paused') {
          return (
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() =>
                setPendingState({ connector: item.jsonData, targetState: 'running' })
              }
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
              onClick={() =>
                setPendingState({ connector: item.jsonData, targetState: 'paused' })
              }
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
            onClick={() =>
              setPendingState({ connector: item.jsonData, targetState: 'running' })
            }
          >
            Start
          </Button>
        );
      },
    },
    'age',
  ];

  return (
    <>
      <ResourceListView title="Kafka Connectors" resourceClass={KafkaConnectorClass} columns={columns} />
      <Dialog
        open={pendingState !== null}
        onClose={() => setPendingState(null)}
        aria-labelledby="connector-state-dialog-title"
        aria-describedby="connector-state-dialog-description"
      >
        <DialogTitle id="connector-state-dialog-title">Change connector state</DialogTitle>
        <DialogContent>
          <DialogContentText id="connector-state-dialog-description">
            Set connector{' '}
            <strong>{pendingState?.connector.metadata.name}</strong> to{' '}
            <strong>{pendingState?.targetState}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingState(null)}>Cancel</Button>
          <Button
            onClick={confirmStateChange}
            color={pendingState?.targetState === 'paused' ? 'warning' : 'primary'}
            variant="contained"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
