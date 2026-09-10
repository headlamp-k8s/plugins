import React from 'react';
import {
  registerDetailsViewHeaderActionsProcessor,
  registerPluginSettings,
  type PluginSettingsDetailsProps,
} from '@kinvolk/headlamp-plugin/lib';
import { Stack, TextField, Typography } from '@mui/material';
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
