import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, TextField, Typography } from '@mui/material';
import React from 'react';
import {
  HOLMES_SERVICE_NAME,
  HOLMES_SERVICE_NAMESPACE,
  HOLMES_SERVICE_PORT,
} from '../../agent/holmesClient';
import type { PluginConfig } from '../../utils';
import { pluginStore } from '../../utils';

function normalizeTextSetting(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

function normalizePortSetting(value: number | undefined): number {
  return Number.isInteger(value) && value >= 1 && value <= 65535 ? value : HOLMES_SERVICE_PORT;
}

export function HolmesAgentSettings(props: { config: PluginConfig | null | undefined }) {
  const config = props.config;

  const holmesNamespace = normalizeTextSetting(config?.holmesNamespace, HOLMES_SERVICE_NAMESPACE);
  const holmesServiceName = normalizeTextSetting(config?.holmesServiceName, HOLMES_SERVICE_NAME);
  const holmesPort = normalizePortSetting(config?.holmesPort);

  const updateConfig = (patch: Partial<PluginConfig>) => {
    const current = pluginStore.get() || {};
    pluginStore.update({
      ...current,
      ...patch,
    });
  };

  const handleNamespaceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({
      holmesNamespace: event.target.value.trim() || HOLMES_SERVICE_NAMESPACE,
    });
  };

  const handleServiceNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateConfig({
      holmesServiceName: event.target.value.trim() || HOLMES_SERVICE_NAME,
    });
  };

  const handlePortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();

    if (value === '') {
      updateConfig({ holmesPort: HOLMES_SERVICE_PORT });
      return;
    }

    const n = Number(value);
    updateConfig({
      holmesPort: Number.isInteger(n) && n >= 1 && n <= 65535 ? n : HOLMES_SERVICE_PORT,
    });
  };

  return (
    <SectionBox title="Holmes Agent">
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Configure how the plugin reaches the HolmesGPT service through the Kubernetes API service
        proxy.
      </Typography>

      <Box display="flex" flexDirection="column" gap={2} sx={{ ml: 1, maxWidth: 480 }}>
        <TextField
          label="Namespace"
          value={holmesNamespace}
          helperText='Namespace where HolmesGPT is deployed (default: "default")'
          onChange={handleNamespaceChange}
          size="small"
        />

        <TextField
          label="Service name"
          value={holmesServiceName}
          helperText='Kubernetes Service name for HolmesGPT (default: "holmesgpt-holmes")'
          onChange={handleServiceNameChange}
          size="small"
        />

        <TextField
          label="Port"
          type="number"
          value={holmesPort}
          helperText="Service port (default: 80)"
          onChange={handlePortChange}
          size="small"
        />
      </Box>
    </SectionBox>
  );
}
