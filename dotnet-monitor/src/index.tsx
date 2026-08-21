import React, { useMemo, useState } from 'react';
import {
  registerAppBarAction,
  registerDetailsViewHeaderActionsProcessor,
  registerPluginSettings,
  type PluginSettingsDetailsProps,
} from '@kinvolk/headlamp-plugin/lib';
import { ActionButton } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { DEFAULT_CONFIG, type DotnetMonitorPluginConfig } from './configDefaults';
import { DotnetMonitorHeaderAction } from './components/DotnetMonitorHeaderAction';
import { unwrapPodResource } from './detection/podResource';

type DotnetMonitorSettingsData = DotnetMonitorPluginConfig;

function DotnetMonitorSettings({ data, onDataChange }: PluginSettingsDetailsProps) {
  const current = {
    ...DEFAULT_CONFIG,
    ...(data ?? {}),
  } as DotnetMonitorPluginConfig;

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        These settings control how the plugin detects a dotnet-monitor sidecar and which Kubernetes pod proxy port it uses.
      </Typography>
      <TextField
        label="Monitor container name"
        value={current.monitorContainerName}
        onChange={(event) => onDataChange?.({ ...current, monitorContainerName: event.target.value })}
        fullWidth
        helperText="Default: dotnet-monitor"
      />
      <TextField
        label="Monitor port"
        type="number"
        value={current.monitorPort}
        onChange={(event) =>
          onDataChange?.({ ...current, monitorPort: Number(event.target.value) || DEFAULT_CONFIG.monitorPort })
        }
        fullWidth
        helperText="Default: 52323"
      />
      <TextField
        label="Pod label selector"
        value={current.podLabelSelector}
        onChange={(event) => onDataChange?.({ ...current, podLabelSelector: event.target.value })}
        fullWidth
        helperText="Optional. Example: dotnet-monitor=true"
      />
      <TextField
        label="Pod annotation selector"
        value={current.podAnnotationSelector}
        onChange={(event) => onDataChange?.({ ...current, podAnnotationSelector: event.target.value })}
        fullWidth
        helperText="Optional. Example: dotnet-monitor=true"
      />
      <TextField
        label="dotnet-monitor API key"
        value={current.monitorApiKey ?? ''}
        onChange={(event) => onDataChange?.({ ...current, monitorApiKey: event.target.value })}
        fullWidth
        helperText="Optional. Stored in Headlamp plugin config in the browser. Prefer avoiding API-key auth when using the pod proxy path."
      />
    </Stack>
  );
}

function DotnetMonitorAppBarAction() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ActionButton description="Headlamp .NET Monitor" icon="mdi:monitor" onClick={() => setOpen(true)} />
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Headlamp .NET Monitor</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2">
              The plugin is loaded and this app-bar action is rendering.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              If you see this button, Headlamp is executing the plugin bundle even if the Pod detail section is not
              visible yet.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

registerAppBarAction(DotnetMonitorAppBarAction);
registerDetailsViewHeaderActionsProcessor((resource, actions) => {
  const pod = unwrapPodResource(resource);
  if (!pod || pod.kind !== 'Pod') {
    return actions;
  }

  if (actions.some((action) => action.id === 'headlamp.dotnet-monitor')) {
    return actions;
  }

  return [
    {
      id: 'headlamp.dotnet-monitor',
      action: <DotnetMonitorHeaderAction item={pod} />,
    },
    ...actions,
  ];
});
registerPluginSettings('headlamp-dotnet-monitor', DotnetMonitorSettings, true);
