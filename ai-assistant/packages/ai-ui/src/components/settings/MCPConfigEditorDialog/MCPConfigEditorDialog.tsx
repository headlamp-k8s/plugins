import { Icon } from '@iconify/react';
import Editor from '@monaco-editor/react';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DefaultDialog } from '../../defaults/DefaultSlots/DefaultSlots';

/** Configuration for a single MCP server process. */
export interface MCPServer {
  /** Unique display name for the server. */
  name: string;
  /** Command used to start the MCP server process. */
  command: string;
  /** Command-line arguments passed to the server process. */
  args: string[];
  /** Optional environment variables for the server process. */
  env?: Record<string, string>;
  /** Whether this server is currently enabled. */
  enabled: boolean;
}

/** Top-level MCP configuration containing global enablement and server list. */
export interface MCPConfig {
  /** Whether MCP functionality is globally enabled. */
  enabled: boolean;
  /** List of configured MCP servers. */
  servers: MCPServer[];
}

/** Props for the MCPConfigEditorDialog that provides a raw JSON/YAML editor for MCP config. */
interface MCPConfigEditorDialogProps {
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

export default function MCPConfigEditorDialog({
  open,
  onClose,
  config,
  onSave,
  DialogSlot = DefaultDialog,
}: MCPConfigEditorDialogProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [validationError, setValidationError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const themeName = localStorage.getItem('headlampThemePreference');

  useEffect(() => {
    if (open) {
      setContent(JSON.stringify(config, null, 2));
      setValidationError('');
      setTabValue(0);
    }
  }, [config, open]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
      setValidationError('');
    }
  };

  const validateConfig = (configToValidate: any): string | null => {
    if (typeof configToValidate.enabled !== 'boolean') {
      return 'enabled field must be a boolean';
    }

    if (!Array.isArray(configToValidate.servers)) {
      return 'servers field must be an array';
    }

    for (let i = 0; i < configToValidate.servers.length; i++) {
      const server = configToValidate.servers[i];

      if (typeof server.name !== 'string' || !server.name.trim()) {
        return `Server ${i + 1}: name must be a non-empty string`;
      }

      if (typeof server.command !== 'string' || !server.command.trim()) {
        return `Server ${i + 1}: command must be a non-empty string`;
      }

      if (!Array.isArray(server.args)) {
        return `Server ${i + 1}: args must be an array`;
      }

      if (server.env !== undefined) {
        if (typeof server.env !== 'object' || server.env === null || Array.isArray(server.env)) {
          return `Server ${i + 1}: env must be an object with string key-value pairs`;
        }

        for (const [key, value] of Object.entries(server.env)) {
          if (typeof key !== 'string' || typeof value !== 'string') {
            return `Server ${i + 1}: env must contain only string key-value pairs`;
          }
        }
      }

      if (typeof server.enabled !== 'boolean') {
        return `Server ${i + 1}: enabled must be a boolean`;
      }
    }

    return null;
  };

  const handleSave = () => {
    try {
      const parsedConfig = JSON.parse(content);

      const error = validateConfig(parsedConfig);
      if (error) {
        setValidationError(error);
        return;
      }

      onSave(parsedConfig);
      onClose();
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : t('Invalid JSON configuration'));
    }
  };

  const handleLoadExample = () => {
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

  const handleReset = () => {
    setContent(JSON.stringify(config, null, 2));
    setValidationError('');
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getSchemaDocumentation = () => {
    return {
      enabled: 'boolean - Enable/disable all MCP servers',
      servers: [
        {
          name: 'string - Unique server name',
          command: 'string - Executable command or path',
          args: ['array of strings - Command arguments'],
          env: {
            KEY: 'string value - Environment variables (optional)',
          },
          enabled: 'boolean - Enable/disable this specific server',
        },
      ],
    };
  };

  return (
    <DialogSlot open={open} maxWidth="lg" fullWidth onClose={onClose}>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{t('Edit MCP Configuration')}</Typography>
          <Box>
            <Button
              size="small"
              variant="text"
              onClick={handleLoadExample}
              startIcon={<Icon icon="mdi:file-document" />}
            >
              {t('Load Example')}
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={handleReset}
              startIcon={<Icon icon="mdi:refresh" />}
            >
              Reset
            </Button>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label={t('Configuration Editor')} />
          <Tab label={t('Schema Documentation')} />
        </Tabs>

        {tabValue === 0 && (
          <Box height="100%">
            {validationError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {validationError}
              </Alert>
            )}

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
              theme={themeName === 'dark' ? 'vs-dark' : 'light'}
            />

            <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
              Edit the JSON configuration above. The editor will automatically format and validate
              your configuration.
            </Typography>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>
                {t('Configuration Schema')}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="textSecondary" paragraph>
                  The MCP configuration defines how your AI assistant connects to external tools and
                  services. Each server represents a separate MCP server that provides specific
                  capabilities.
                </Typography>
              </Box>

              <Box sx={{ fontFamily: 'monospace' }}>
                <pre
                  style={{
                    backgroundColor: themeName === 'dark' ? '#1e1e1e' : '#f5f5f5',
                    padding: '16px',
                    borderRadius: '4px',
                    overflow: 'auto',
                  }}
                >
                  {JSON.stringify(getSchemaDocumentation(), null, 2)}
                </pre>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
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
