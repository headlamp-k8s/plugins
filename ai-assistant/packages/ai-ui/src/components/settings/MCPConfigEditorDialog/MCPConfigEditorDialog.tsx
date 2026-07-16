import type { MCPServer, MCPSettings } from '@headlamp-k8s/ai-common/mcp/types';
import { Icon } from '@iconify/react';
import Editor from '@monaco-editor/react';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DefaultDialog } from '../../defaults/DefaultSlots/DefaultSlots';

/** Top-level MCP configuration edited by this dialog. */
export type MCPConfig = MCPSettings;

/** Props for the MCPConfigEditorDialog that provides a raw JSON/YAML editor for MCP config. */
export interface MCPConfigEditorDialogProps {
  /** Whether the editor dialog is currently visible. */
  open: boolean;
  /** Callback invoked when the dialog is dismissed. */
  onClose: () => void;
  /** Current MCP configuration to display and edit. */
  config: MCPConfig;
  /** Callback invoked when the user saves the edited configuration. */
  onSave: (config: MCPConfig) => void;
  /** Component used to render the dialog shell. Falls back to MUI Dialog. */
  DialogSlot?: React.ElementType;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

type ValidationResult = { valid: false; error: string } | { valid: true; config: MCPConfig };

/** @returns Whether an untrusted JSON value is a non-null object mapping. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** @returns Whether an untrusted value is a mapping containing only string values. */
function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every(item => typeof item === 'string');
}

/**
 * Validates and normalizes untrusted MCP configuration JSON.
 *
 * @param value - Parsed JSON value.
 * @param t - Translation function for validation messages.
 * @returns A normalized config or translated validation failure.
 */
function validateConfig(value: unknown, t: Translate): ValidationResult {
  if (!isRecord(value) || typeof value.enabled !== 'boolean') {
    return { valid: false, error: t('enabled field must be a boolean') };
  }
  if (!Array.isArray(value.servers)) {
    return { valid: false, error: t('servers field must be an array') };
  }

  const servers: MCPServer[] = [];
  const serverNames = new Set<string>();
  for (let index = 0; index < value.servers.length; index += 1) {
    const server = value.servers[index];
    const number = index + 1;
    if (!isRecord(server)) {
      return { valid: false, error: t('Server {{number}} must be an object', { number }) };
    }
    if (typeof server.name !== 'string' || !server.name.trim()) {
      return {
        valid: false,
        error: t('Server {{number}}: name must be a non-empty string', { number }),
      };
    }
    if (typeof server.command !== 'string' || !server.command.trim()) {
      return {
        valid: false,
        error: t('Server {{number}}: command must be a non-empty string', { number }),
      };
    }
    const normalizedName = server.name.trim();
    if (serverNames.has(normalizedName.toLowerCase())) {
      return {
        valid: false,
        error: t('Server names must be unique'),
      };
    }
    serverNames.add(normalizedName.toLowerCase());
    if (!Array.isArray(server.args) || !server.args.every(arg => typeof arg === 'string')) {
      return {
        valid: false,
        error: t('Server {{number}}: args must be an array of strings', { number }),
      };
    }
    const env = server.env;
    if (env !== undefined && !isStringRecord(env)) {
      return {
        valid: false,
        error: t('Server {{number}}: env must contain only string key-value pairs', { number }),
      };
    }
    if (typeof server.enabled !== 'boolean') {
      return {
        valid: false,
        error: t('Server {{number}}: enabled must be a boolean', { number }),
      };
    }
    const autoApprove = server.autoApprove;
    if (autoApprove !== undefined && typeof autoApprove !== 'boolean') {
      return {
        valid: false,
        error: t('Server {{number}}: autoApprove must be a boolean', { number }),
      };
    }

    const normalizedServer: MCPServer = {
      name: normalizedName,
      command: server.command.trim(),
      args: server.args,
      enabled: server.enabled,
    };
    if (isStringRecord(env)) normalizedServer.env = env;
    if (typeof autoApprove === 'boolean') normalizedServer.autoApprove = autoApprove;
    servers.push(normalizedServer);
  }

  return { valid: true, config: { enabled: value.enabled, servers } };
}

/** @returns Monaco theme matching Headlamp, or light when storage is unavailable. */
function getEditorTheme(): 'vs-dark' | 'light' {
  try {
    return localStorage.getItem('headlampThemePreference') === 'dark' ? 'vs-dark' : 'light';
  } catch {
    return 'light';
  }
}

/**
 * Renders a raw JSON editor and schema reference for MCP settings.
 *
 * @param props - Dialog state, current config, save callback, and optional dialog slot.
 * @returns Validating MCP configuration editor dialog.
 */
export default function MCPConfigEditorDialog({
  open,
  onClose,
  config,
  onSave,
  DialogSlot = DefaultDialog,
}: MCPConfigEditorDialogProps): React.ReactElement {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [validationError, setValidationError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const editorTheme = getEditorTheme();
  const titleId = React.useId();

  useEffect(() => {
    if (open) {
      setContent(JSON.stringify(config, null, 2));
      setValidationError('');
      setTabValue(0);
    }
  }, [config, open]);

  /** Updates editor content and clears stale validation. @param value - Monaco value. @returns No value. */
  const handleEditorChange = (value: string | undefined): void => {
    if (value !== undefined) {
      setContent(value);
      setValidationError('');
    }
  };

  /** Validates, normalizes, and saves the current JSON content. @returns No value. */
  const handleSave = (): void => {
    try {
      const parsedConfig: unknown = JSON.parse(content);
      const validation = validateConfig(parsedConfig, t);
      if (validation.valid === false) {
        setValidationError(validation.error);
        return;
      }

      onSave(validation.config);
      onClose();
    } catch {
      setValidationError(t('Invalid JSON configuration'));
    }
  };

  /** Loads a valid example configuration into the editor. @returns No value. */
  const handleLoadExample = (): void => {
    const exampleConfig: MCPConfig = {
      enabled: true,
      servers: [
        {
          name: 'flux-mcp',
          command: 'flux-operator-mcp',
          args: ['serve', '--kube-context', 'HEADLAMP_CURRENT_CLUSTER'],
          env: {
            KUBECONFIG: 'PATH_TO_KUBECONFIG',
          },
          enabled: true,
        },
      ],
    };

    setContent(JSON.stringify(exampleConfig, null, 2));
    setValidationError('');
    setTabValue(0);
  };

  /** Restores the latest host-provided configuration. @returns No value. */
  const handleReset = (): void => {
    setContent(JSON.stringify(config, null, 2));
    setValidationError('');
  };

  /** Changes the active editor/documentation tab. @returns No value. */
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue);
  };

  /** @returns Translated schema documentation rendered as JSON. */
  const getSchemaDocumentation = (): Record<string, unknown> => {
    return {
      enabled: t('boolean - Enable or disable all MCP servers'),
      servers: [
        {
          name: t('string - Unique server name'),
          command: t('string - Executable command or path'),
          args: [t('array of strings - Command arguments')],
          env: {
            KEY: t('string value - Environment variables (optional)'),
          },
          enabled: t('boolean - Enable or disable this server'),
        },
      ],
    };
  };

  return (
    <DialogSlot open={open} maxWidth="lg" fullWidth onClose={onClose} aria-labelledby={titleId}>
      <Box sx={{ px: 3, py: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography id={titleId} variant="h6" component="h2">
            {t('Edit MCP Configuration')}
          </Typography>
          <Box>
            <Button
              size="small"
              variant="text"
              onClick={handleLoadExample}
              startIcon={<Icon icon="mdi:file-document" aria-hidden="true" />}
            >
              {t('Load Example')}
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={handleReset}
              startIcon={<Icon icon="mdi:refresh" aria-hidden="true" />}
            >
              {t('Reset')}
            </Button>
          </Box>
        </Box>
      </Box>

      <DialogContent>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label={t('MCP configuration views')}
          sx={{ mb: 2 }}
        >
          <Tab
            id="mcp-config-editor-tab"
            aria-controls="mcp-config-editor-panel"
            label={t('Configuration Editor')}
          />
          <Tab
            id="mcp-config-schema-tab"
            aria-controls="mcp-config-schema-panel"
            label={t('Schema Documentation')}
          />
        </Tabs>

        {tabValue === 0 && (
          <Box
            id="mcp-config-editor-panel"
            role="tabpanel"
            aria-labelledby="mcp-config-editor-tab"
            height="100%"
          >
            {validationError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {validationError}
              </Alert>
            )}

            <Box role="region" aria-label={t('MCP configuration JSON editor')}>
              <Editor
                value={content}
                onChange={handleEditorChange}
                language="json"
                height="450px"
                options={{
                  selectOnLineNumbers: true,
                  minimap: { enabled: true },
                  formatOnPaste: true,
                  formatOnType: true,
                  automaticLayout: true,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                }}
                theme={editorTheme}
              />
            </Box>

            <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
              {t(
                'Edit the JSON configuration above. The editor will automatically format and validate your configuration.'
              )}
            </Typography>
          </Box>
        )}

        {tabValue === 1 && (
          <Box id="mcp-config-schema-panel" role="tabpanel" aria-labelledby="mcp-config-schema-tab">
            <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
              <Typography variant="h6" component="h3" gutterBottom>
                {t('Configuration Schema')}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {t(
                    'The MCP configuration defines how your AI assistant connects to external tools and services. Each server represents a separate MCP server that provides specific capabilities.'
                  )}
                </Typography>
              </Box>

              <Box sx={{ fontFamily: 'monospace' }}>
                <pre
                  aria-label={t('MCP configuration schema example')}
                  style={{
                    backgroundColor: editorTheme === 'vs-dark' ? '#1e1e1e' : '#f5f5f5',
                    padding: '16px',
                    borderRadius: '4px',
                    overflow: 'auto',
                  }}
                >
                  {JSON.stringify(getSchemaDocumentation(), null, 2)}
                </pre>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" component="h4" gutterBottom>
                  {t('Field Descriptions:')}
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  <li>
                    <Typography variant="body2">
                      <strong>enabled</strong>:{' '}
                      {t('Master switch to enable/disable all MCP servers')}
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>servers</strong>: {t('Array of MCP server configurations')}
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>name</strong>: {t('Unique identifier for the server')}
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>command</strong>:{' '}
                      {t('The executable to run (e.g., "docker", "npx", "python")')}
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>args</strong>:{' '}
                      {t('Command-line arguments passed to the executable. You can use')}{' '}
                      <code>HEADLAMP_CURRENT_CLUSTER</code>{' '}
                      {t(
                        'as a placeholder that will be replaced with the current cluster context at runtime.'
                      )}
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>env</strong>:{' '}
                      {t('Optional environment variables for the server process')}
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      <strong>enabled</strong>:{' '}
                      {t('Toggle individual server on/off without removing configuration')}
                    </Typography>
                  </li>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          {t('Cancel')}
        </Button>
        <Button variant="contained" color="primary" onClick={handleSave} disabled={tabValue === 1}>
          {t('Save Configuration')}
        </Button>
      </DialogActions>
    </DialogSlot>
  );
}
