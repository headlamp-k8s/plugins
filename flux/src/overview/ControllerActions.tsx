import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ActionButton, LogViewer, Terminal } from '@kinvolk/headlamp-plugin/lib/components/common';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import type Pod from '@kinvolk/headlamp-plugin/lib/lib/k8s/pod';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React from 'react';
import { containerNamesForPod } from './controllerPods';

const LOG_TAIL_LINES = 100;

/**
 * Per-row Logs and Terminal actions for a Flux controller.
 *
 * Both open in place rather than navigating to the Pod view: the point of the
 * issue is to keep the user in the Flux overview while debugging a failed
 * reconciliation.
 */
export function ControllerActions({ controller, pods }: { controller: KubeObject; pods: Pod[] }) {
  const { t } = useTranslation();
  const [showLogs, setShowLogs] = React.useState(false);
  const [showTerminal, setShowTerminal] = React.useState(false);
  const [selectedPodName, setSelectedPodName] = React.useState('');
  const [selectedContainer, setSelectedContainer] = React.useState('');
  const [logs, setLogs] = React.useState<string[]>([]);

  const podNames = pods.map(pod => pod.getName());
  // Fall back to the first pod whenever the selection is empty or points at a
  // pod that has since been replaced (controllers get rescheduled often).
  const activePod = pods.find(pod => pod.getName() === selectedPodName) ?? pods[0];
  const containers = containerNamesForPod(activePod);
  const activeContainer = containers.includes(selectedContainer)
    ? selectedContainer
    : containers[0] ?? '';

  const hasPods = pods.length > 0;
  const controllerName = controller.metadata.name;

  React.useEffect(() => {
    if (!showLogs || !activePod || !activeContainer) {
      return undefined;
    }

    setLogs([]);
    // getLogs hands back the whole buffer on each call, so replacing state is
    // correct here - appending would duplicate every line.
    return activePod.getLogs(
      activeContainer,
      ({ logs: streamedLogs }: { logs: string[] }) => setLogs(streamedLogs),
      { tailLines: LOG_TAIL_LINES, follow: true, showTimestamps: false, showPrevious: false }
    );
  }, [showLogs, activePod?.getName(), activeContainer]);

  const selectors = [
    podNames.length > 1 && (
      <FormControl key="pod" size="small" sx={{ minWidth: 220, mr: 1 }}>
        <InputLabel id={`${controllerName}-pod-label`}>{t('Pod')}</InputLabel>
        <Select
          labelId={`${controllerName}-pod-label`}
          label={t('Pod')}
          value={activePod?.getName() ?? ''}
          onChange={event => setSelectedPodName(event.target.value as string)}
        >
          {podNames.map(name => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    ),
    containers.length > 1 && (
      <FormControl key="container" size="small" sx={{ minWidth: 180 }}>
        <InputLabel id={`${controllerName}-container-label`}>{t('Container')}</InputLabel>
        <Select
          labelId={`${controllerName}-container-label`}
          label={t('Container')}
          value={activeContainer}
          onChange={event => setSelectedContainer(event.target.value as string)}
        >
          {containers.map(name => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    ),
  ].filter(Boolean);

  return (
    <Box display="flex">
      <ActionButton
        description={
          hasPods
            ? t('Show logs for {{ name }}', { name: controllerName })
            : t('No pods running for {{ name }}', { name: controllerName })
        }
        icon="mdi:file-document-box-outline"
        iconButtonProps={{ disabled: !hasPods }}
        onClick={() => setShowLogs(true)}
      />
      <ActionButton
        description={
          hasPods
            ? t('Open a terminal in {{ name }}', { name: controllerName })
            : t('No pods running for {{ name }}', { name: controllerName })
        }
        icon="mdi:console"
        iconButtonProps={{ disabled: !hasPods }}
        onClick={() => setShowTerminal(true)}
      />

      {showLogs && activePod && (
        <LogViewer
          open={showLogs}
          onClose={() => setShowLogs(false)}
          logs={logs}
          title={t('Logs: {{ name }}', { name: activePod.getName() })}
          downloadName={`${activePod.getName()}-${activeContainer}`}
          topActions={selectors}
        />
      )}

      {showTerminal && activePod && (
        <Terminal open={showTerminal} onClose={() => setShowTerminal(false)} item={activePod} />
      )}
    </Box>
  );
}
