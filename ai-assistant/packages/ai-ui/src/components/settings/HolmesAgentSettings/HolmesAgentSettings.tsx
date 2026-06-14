import { Box, TextField, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DefaultSectionWrapper } from '../../defaults/DefaultSlots/DefaultSlots';

/** Default Holmes service namespace. */
export const DEFAULT_HOLMES_NAMESPACE = 'default';
/** Default Holmes service name. */
export const DEFAULT_HOLMES_SERVICE_NAME = 'holmesgpt-holmes';
/** Default Holmes service port. */
export const DEFAULT_HOLMES_PORT = 80;

/** Props for the HolmesAgentSettings component. */
export interface HolmesAgentSettingsProps {
  /** Current plugin config object (may be null/undefined). */
  config: any | null | undefined;
  /** Callback invoked when a config field changes. */
  onConfigChange: (patch: Record<string, any>) => void;
  /** Optional wrapper component for layout (e.g. SectionBox). Falls back to a simple Box with title. */
  SectionWrapper?: React.ComponentType<{ title: string; children: React.ReactNode }>;
  /** Default namespace value. */
  defaultNamespace?: string;
  /** Default service name value. */
  defaultServiceName?: string;
  /** Default port value. */
  defaultPort?: number;
}

function normalizeTextSetting(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

function normalizePortSetting(value: number | undefined, defaultPort: number): number {
  return Number.isInteger(value) && value! >= 1 && value! <= 65535 ? value! : defaultPort;
}

export function HolmesAgentSettings({
  config,
  onConfigChange,
  SectionWrapper = DefaultSectionWrapper,
  defaultNamespace = DEFAULT_HOLMES_NAMESPACE,
  defaultServiceName = DEFAULT_HOLMES_SERVICE_NAME,
  defaultPort = DEFAULT_HOLMES_PORT,
}: HolmesAgentSettingsProps) {
  const { t } = useTranslation();
  const holmesNamespace = normalizeTextSetting(config?.holmesNamespace, defaultNamespace);
  const holmesServiceName = normalizeTextSetting(config?.holmesServiceName, defaultServiceName);
  const holmesPort = normalizePortSetting(config?.holmesPort, defaultPort);

  const handleNamespaceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({
      holmesNamespace: event.target.value.trim() || defaultNamespace,
    });
  };

  const handleServiceNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({
      holmesServiceName: event.target.value.trim() || defaultServiceName,
    });
  };

  const handlePortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();

    if (value === '') {
      onConfigChange({ holmesPort: defaultPort });
      return;
    }

    const n = Number(value);
    onConfigChange({
      holmesPort: Number.isInteger(n) && n >= 1 && n <= 65535 ? n : defaultPort,
    });
  };

  return (
    <SectionWrapper title={t('Holmes Agent')}>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Configure how the plugin reaches the HolmesGPT service through the Kubernetes API service
        proxy.
      </Typography>

      <Box display="flex" flexDirection="column" gap={2} sx={{ ml: 1, maxWidth: 480 }}>
        <TextField
          label={t('Namespace')}
          value={holmesNamespace}
          helperText='Namespace where HolmesGPT is deployed (default: "default")'
          onChange={handleNamespaceChange}
          size="small"
        />

        <TextField
          label={t('Service name')}
          value={holmesServiceName}
          helperText='Kubernetes Service name for HolmesGPT (default: "holmesgpt-holmes")'
          onChange={handleServiceNameChange}
          size="small"
        />

        <TextField
          label={t('Port')}
          type="number"
          value={holmesPort}
          helperText="Service port (default: 80)"
          onChange={handlePortChange}
          size="small"
        />
      </Box>
    </SectionWrapper>
  );
}

export default HolmesAgentSettings;
