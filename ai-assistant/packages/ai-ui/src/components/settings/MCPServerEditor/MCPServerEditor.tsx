import { Icon } from '@iconify/react';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
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

/** Props for the MCPServerEditor dialog component. */
interface MCPServerEditorProps {
  /** Whether the editor dialog is currently visible. */
  open: boolean;
  /** Callback invoked when the dialog is closed. */
  onClose: () => void;
  /** Existing server to edit, or undefined when adding a new server. */
  server?: MCPServer;
  /** Callback invoked when the user saves the server configuration. */
  onSave: (server: MCPServer) => void;
  /** Names of existing servers, used to prevent duplicate names. */
  existingServerNames: string[];
  /** Component used to render the dialog shell. Falls back to MUI Dialog. */
  DialogSlot?: React.ElementType;
}

export default function MCPServerEditor({
  open,
  onClose,
  server,
  onSave,
  existingServerNames,
  DialogSlot = DefaultDialog,
}: MCPServerEditorProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [command, setCommand] = useState('');
  const [args, setArgs] = useState('');
  const [env, setEnv] = useState<Array<{ key: string; value: string }>>([]);
  const [enabled, setEnabled] = useState(true);
  const [validationError, setValidationError] = useState('');

  const isEditing = !!server;

  useEffect(() => {
    if (open) {
      if (server) {
        setName(server.name);
        setCommand(server.command);
        setArgs(server.args.join(' '));
        setEnv(
          server.env ? Object.entries(server.env).map(([key, value]) => ({ key, value })) : []
        );
        setEnabled(server.enabled);
      } else {
        setName('');
        setCommand('');
        setArgs('');
        setEnv([]);
        setEnabled(true);
      }
      setValidationError('');
    }
  }, [open, server]);

  const handleAddEnvVar = () => {
    setEnv([...env, { key: '', value: '' }]);
  };

  const handleRemoveEnvVar = (index: number) => {
    setEnv(env.filter((_, i) => i !== index));
  };

  const handleEnvVarChange = (index: number, field: 'key' | 'value', value: string) => {
    const newEnv = [...env];
    newEnv[index][field] = value;
    setEnv(newEnv);
  };

  const handleLoadExample = () => {
    setName('flux-mcp');
    setCommand('flux-operator-mcp');
    setArgs('serve --kube-context HEADLAMP_CURRENT_CLUSTER');
    setEnv([{ key: 'KUBECONFIG', value: 'PATH_TO_KUBECONFIG' }]);
    setEnabled(true);
    setValidationError('');
  };

  const validateServer = (): string | null => {
    if (!name.trim()) {
      return t('Server name is required');
    }

    if (!command.trim()) {
      return t('Command is required');
    }

    // Check for duplicate names (excluding current server if editing)
    const namesToCheck = existingServerNames.filter(n => !isEditing || n !== server?.name);
    if (namesToCheck.map(n => n.toLowerCase()).includes(name.toLowerCase())) {
      return t('A server with this name already exists');
    }

    // Validate env variables
    for (const envVar of env) {
      if (!envVar.key.trim()) {
        return t('Environment variable keys cannot be empty');
      }
    }

    return null;
  };

  const handleSave = () => {
    const error = validateServer();
    if (error) {
      setValidationError(error);
      return;
    }

    const mcpServer: MCPServer = {
      name,
      command,
      args: args
        .split(/\s+/)
        .filter(arg => arg.trim())
        .map(arg => arg.trim()),
      enabled,
    };

    if (env.length > 0) {
      mcpServer.env = env.reduce((acc, { key, value }) => {
        if (key.trim()) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);
    }

    onSave(mcpServer);
    onClose();
  };

  return (
    <DialogSlot open={open} maxWidth="md" fullWidth onClose={onClose}>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{isEditing ? t('Edit Server') : t('Add MCP Server')}</Typography>
          {!isEditing && (
            <Button
              size="small"
              variant="text"
              onClick={handleLoadExample}
              startIcon={<Icon icon="mdi:file-document" />}
            >
              Load Example
            </Button>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {validationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validationError}
          </Alert>
        )}

        <Box display="flex" flexDirection="column" gap={2}>
          <Box display="flex" gap={2} alignItems="flex-start">
            <TextField
              label={t('Server Name')}
              value={name}
              onChange={e => setName(e.target.value)}
              fullWidth
              required
              helperText={t('Unique identifier for this MCP server')}
            />
            <FormControlLabel
              control={<Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} />}
              label={t('Enabled')}
              sx={{ mt: 1, minWidth: '120px' }}
            />
          </Box>

          <TextField
            label={t('Command')}
            value={command}
            onChange={e => setCommand(e.target.value)}
            fullWidth
            required
            helperText={t("Executable command (e.g., 'docker', 'npx', 'python')")}
          />

          <TextField
            label={t('Arguments')}
            value={args}
            onChange={e => setArgs(e.target.value)}
            fullWidth
            helperText={t(
              'Command-line arguments separated by spaces. Use HEADLAMP_CURRENT_CLUSTER as a placeholder for the current cluster context.'
            )}
          />

          {/* {t('Environment Variables')} */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Box>
                <Typography variant="subtitle2">{t('Environment Variables')}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {t('Use')} <code>HEADLAMP_CURRENT_CLUSTER</code>{' '}
                  {t('as a placeholder for the current cluster context')}
                </Typography>
              </Box>
              <Button size="small" onClick={handleAddEnvVar} startIcon={<Icon icon="mdi:plus" />}>
                {t('Add Variable')}
              </Button>
            </Box>

            {env.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                {t('No environment variables configured')}
              </Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={1}>
                {env.map((envVar, index) => (
                  <Box key={index} display="flex" gap={1} alignItems="center">
                    <TextField
                      label={t('Key')}
                      value={envVar.key}
                      onChange={e => handleEnvVarChange(index, 'key', e.target.value)}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label={t('Value')}
                      value={envVar.value}
                      onChange={e => handleEnvVarChange(index, 'value', e.target.value)}
                      size="small"
                      sx={{ flex: 2 }}
                      placeholder={t('e.g., HEADLAMP_CURRENT_CLUSTER')}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveEnvVar(index)}
                      color="error"
                      aria-label={
                        envVar.key
                          ? `Remove environment variable ${envVar.key}`
                          : `Remove environment variable ${index + 1}`
                      }
                    >
                      <Icon icon="mdi:delete" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave}>
          {isEditing ? 'Save' : 'Add Server'}
        </Button>
      </DialogActions>
    </DialogSlot>
  );
}
