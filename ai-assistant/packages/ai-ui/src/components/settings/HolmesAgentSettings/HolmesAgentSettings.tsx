import { Box, Link, TextField, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_HOLMES_DOCS_URL } from '../../assistant/HolmesSetupGuide/HolmesSetupGuide';
import { DefaultSectionWrapper } from '../../defaults/DefaultSlots/DefaultSlots';

/** Default Holmes service namespace. */
export const DEFAULT_HOLMES_NAMESPACE = 'default';
/** Default Holmes service name. */
export const DEFAULT_HOLMES_SERVICE_NAME = 'holmesgpt-holmes';
/** Default Holmes service port. */
export const DEFAULT_HOLMES_PORT = 80;

/** Persisted Holmes settings recognized by the UI. */
export interface HolmesSettingsPatch {
  /** Kubernetes namespace containing the Holmes service. */
  holmesNamespace?: string;
  /** Kubernetes Service name for Holmes. */
  holmesServiceName?: string;
  /** Service port used through the Kubernetes API proxy. */
  holmesPort?: number;
  /** Additional plugin settings preserved by broader host patch handlers. */
  [key: string]: unknown;
}

/** Props for the HolmesAgentSettings component. */
export interface HolmesAgentSettingsProps {
  /** Current persisted plugin configuration, validated before use. */
  config: unknown;
  /** Callback invoked when a config field changes. */
  onConfigChange: (patch: HolmesSettingsPatch) => void;
  /** Optional wrapper component for layout (e.g. SectionBox). Falls back to a simple Box with title. */
  SectionWrapper?: React.ComponentType<{ title: string; children: React.ReactNode }>;
  /** Default namespace value. */
  defaultNamespace?: string;
  /** Default service name value. */
  defaultServiceName?: string;
  /** Default port value. */
  defaultPort?: number;
}

/**
 * Returns an object-like persisted config or an empty object.
 *
 * @param value - Persisted value to inspect.
 * @returns Record suitable for guarded property reads.
 */
function asConfigRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value))
    : {};
}

/**
 * Normalizes a persisted text setting.
 *
 * @param value - Persisted value to validate.
 * @param fallback - Value used when persisted text is absent or blank.
 * @returns Trimmed persisted text or the fallback.
 */
function normalizeTextSetting(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

/**
 * Normalizes a service port into the valid TCP port range.
 *
 * @param value - Persisted port to validate.
 * @param defaultPort - Fallback port supplied by the host.
 * @returns Valid persisted or fallback port, otherwise the built-in default.
 */
function normalizePortSetting(value: unknown, defaultPort: number): number {
  const fallback =
    Number.isInteger(defaultPort) && defaultPort >= 1 && defaultPort <= 65535
      ? defaultPort
      : DEFAULT_HOLMES_PORT;
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 65535
    ? value
    : fallback;
}

/**
 * Renders editable Holmes service connection settings.
 *
 * @param props - Persisted config, host defaults, and change callback.
 * @returns Holmes settings form.
 */
export function HolmesAgentSettings({
  config,
  onConfigChange,
  SectionWrapper = DefaultSectionWrapper,
  defaultNamespace = DEFAULT_HOLMES_NAMESPACE,
  defaultServiceName = DEFAULT_HOLMES_SERVICE_NAME,
  defaultPort = DEFAULT_HOLMES_PORT,
}: HolmesAgentSettingsProps) {
  const { t } = useTranslation();
  const configRecord = asConfigRecord(config);
  const holmesNamespace = normalizeTextSetting(configRecord.holmesNamespace, defaultNamespace);
  const holmesServiceName = normalizeTextSetting(
    configRecord.holmesServiceName,
    defaultServiceName
  );
  const normalizedDefaultPort = normalizePortSetting(undefined, defaultPort);
  const holmesPort = normalizePortSetting(configRecord.holmesPort, normalizedDefaultPort);
  const [portDraft, setPortDraft] = React.useState(String(holmesPort));
  React.useEffect(() => setPortDraft(String(holmesPort)), [holmesPort]);
  const parsedPort = Number(portDraft);
  const portIsValid =
    portDraft.trim() !== '' &&
    Number.isInteger(parsedPort) &&
    parsedPort >= 1 &&
    parsedPort <= 65535;

  /** Updates the Holmes namespace. @param event - Namespace input event. @returns No value. */
  const handleNamespaceChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onConfigChange({
      holmesNamespace: event.target.value.trim() || defaultNamespace,
    });
  };

  /** Updates the Holmes service name. @param event - Service input event. @returns No value. */
  const handleServiceNameChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onConfigChange({
      holmesServiceName: event.target.value.trim() || defaultServiceName,
    });
  };

  /** Updates the editable Holmes service-port draft. @param event - Port input event. @returns No value. */
  const handlePortChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setPortDraft(event.target.value);
  };

  /** Persists a valid Holmes service port or the configured default. @returns No value. */
  const handlePortBlur = (): void => {
    const committedPort = portIsValid ? parsedPort : normalizedDefaultPort;
    setPortDraft(String(committedPort));
    onConfigChange({ holmesPort: committedPort });
  };

  return (
    <SectionWrapper title={t('Holmes Agent')}>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
        {t(
          'HolmesGPT is cluster-scoped: it must be installed and running inside your Kubernetes cluster. The plugin reaches the HolmesGPT service through the Kubernetes API service proxy.'
        )}
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        <Link href={DEFAULT_HOLMES_DOCS_URL} target="_blank" rel="noopener noreferrer">
          {t('Learn how to install HolmesGPT in your cluster →')}
        </Link>
      </Typography>

      <Box display="flex" flexDirection="column" gap={2} sx={{ ml: 1, maxWidth: 480 }}>
        <TextField
          label={t('Namespace')}
          value={holmesNamespace}
          helperText={t('Namespace where HolmesGPT is deployed (default: "{{namespace}}")', {
            namespace: defaultNamespace,
          })}
          onChange={handleNamespaceChange}
          size="small"
        />

        <TextField
          label={t('Service name')}
          value={holmesServiceName}
          helperText={t('Kubernetes Service name for HolmesGPT (default: "{{service}}")', {
            service: defaultServiceName,
          })}
          onChange={handleServiceNameChange}
          size="small"
        />

        <TextField
          label={t('Port')}
          type="number"
          value={portDraft}
          error={!portIsValid}
          helperText={
            portIsValid
              ? t('Service port (default: {{port}})', { port: normalizedDefaultPort })
              : t('Enter a whole-number port between 1 and 65535.')
          }
          onChange={handlePortChange}
          onBlur={handlePortBlur}
          size="small"
          inputProps={{ min: 1, max: 65535 }}
        />
      </Box>
    </SectionWrapper>
  );
}

export default HolmesAgentSettings;
