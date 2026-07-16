import type { MCPServer } from '@headlamp-k8s/ai-common/mcp/types';
import { Icon } from '@iconify/react';
import {
  Alert,
  Box,
  Button,
  DialogActions,
  DialogContent,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DefaultDialog } from '../../defaults/DefaultSlots/DefaultSlots';

export type { MCPServer } from '@headlamp-k8s/ai-common/mcp/types';

/** Props for the MCPServerEditor dialog component. */
export interface MCPServerEditorProps {
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

/**
 * Renders a validating form for adding or editing one MCP server.
 *
 * @param props - Dialog state, server data, duplicate-name context, callbacks, and dialog slot.
 * @returns MCP server editor dialog.
 */
export default function MCPServerEditor({
  open,
  onClose,
  server,
  onSave,
  existingServerNames,
  DialogSlot = DefaultDialog,
}: MCPServerEditorProps): React.ReactElement {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [command, setCommand] = useState('');
  const [args, setArgs] = useState('');
  const [env, setEnv] = useState<Array<{ key: string; value: string }>>([]);
  const [enabled, setEnabled] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [validationError, setValidationError] = useState('');
  const titleId = React.useId();

  const isEditing = !!server;

  useEffect(() => {
    if (open) {
      if (server) {
        setName(server.name);
        setCommand(server.command);
        setArgs(JSON.stringify(server.args));
        setEnv(
          server.env ? Object.entries(server.env).map(([key, value]) => ({ key, value })) : []
        );
        setEnabled(server.enabled);
        setAutoApprove(server.autoApprove ?? false);
      } else {
        setName('');
        setCommand('');
        setArgs('[]');
        setEnv([]);
        setEnabled(true);
        setAutoApprove(false);
      }
      setValidationError('');
    }
  }, [open, server]);

  /** Adds an empty environment row. @returns No value. */
  const handleAddEnvVar = (): void => {
    setEnv(currentEnv => [...currentEnv, { key: '', value: '' }]);
    setValidationError('');
  };

  /** Removes one environment row. @param index - Row index. @returns No value. */
  const handleRemoveEnvVar = (index: number): void => {
    setEnv(currentEnv => currentEnv.filter((_, currentIndex) => currentIndex !== index));
    setValidationError('');
  };

  /**
   * Updates one environment row without mutating previous state.
   *
   * @param index - Row index.
   * @param field - Environment key or value field.
   * @param value - New field value.
   * @returns No value.
   */
  const handleEnvVarChange = (index: number, field: 'key' | 'value', value: string): void => {
    setEnv(currentEnv =>
      currentEnv.map((item, currentIndex) =>
        currentIndex === index ? { ...item, [field]: value } : item
      )
    );
    setValidationError('');
  };

  /** Loads a valid example server. @returns No value. */
  const handleLoadExample = (): void => {
    setName('flux-mcp');
    setCommand('flux-operator-mcp');
    setArgs(JSON.stringify(['serve', '--kube-context', 'HEADLAMP_CURRENT_CLUSTER']));
    setEnv([{ key: 'KUBECONFIG', value: 'PATH_TO_KUBECONFIG' }]);
    setEnabled(true);
    setAutoApprove(false);
    setValidationError('');
  };

  /** @returns Parsed argument array or a translated validation failure. */
  const parseArgs = (): { args?: string[]; error?: string } => {
    try {
      const parsed: unknown = JSON.parse(args);
      return Array.isArray(parsed) && parsed.every(item => typeof item === 'string')
        ? { args: parsed }
        : { error: t('Arguments must be a JSON array of strings') };
    } catch {
      return { error: t('Arguments must be valid JSON') };
    }
  };

  /** @returns Translated validation failure, or null when valid. */
  const validateServer = (): string | null => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      return t('Server name is required');
    }

    if (!command.trim()) {
      return t('Command is required');
    }

    // Check for duplicate names (excluding current server if editing)
    const namesToCheck = existingServerNames.filter(n => !isEditing || n !== server?.name);
    if (namesToCheck.map(n => n.trim().toLowerCase()).includes(normalizedName.toLowerCase())) {
      return t('A server with this name already exists');
    }

    const parsedArgs = parseArgs();
    if (parsedArgs.error) return parsedArgs.error;

    // Validate env variables
    const seenKeys = new Set<string>();
    for (const envVar of env) {
      const key = envVar.key.trim();
      if (!key) {
        return t('Environment variable keys cannot be empty');
      }
      if (seenKeys.has(key)) return t('Environment variable keys must be unique');
      seenKeys.add(key);
    }

    return null;
  };

  /** Validates and saves the normalized server. @returns No value. */
  const handleSave = (): void => {
    const error = validateServer();
    if (error) {
      setValidationError(error);
      return;
    }

    const parsedArgs = parseArgs();
    if (!parsedArgs.args) return;
    const mcpServer: MCPServer = {
      name: name.trim(),
      command: command.trim(),
      args: parsedArgs.args,
      enabled,
      autoApprove,
    };

    if (env.length > 0) {
      mcpServer.env = Object.fromEntries(env.map(item => [item.key.trim(), item.value]));
    }

    onSave(mcpServer);
    onClose();
  };

  return (
    <DialogSlot open={open} maxWidth="md" fullWidth onClose={onClose} aria-labelledby={titleId}>
      <Box sx={{ px: 3, py: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography id={titleId} variant="h6" component="h2">
            {isEditing ? t('Edit Server') : t('Add MCP Server')}
          </Typography>
          {!isEditing && (
            <Button
              size="small"
              variant="text"
              onClick={handleLoadExample}
              startIcon={<Icon icon="mdi:file-document" aria-hidden="true" />}
            >
              {t('Load Example')}
            </Button>
          )}
        </Box>
      </Box>

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
              onChange={event => {
                setName(event.target.value);
                setValidationError('');
              }}
              fullWidth
              required
              helperText={t('Unique identifier for this MCP server')}
            />
            <FormControlLabel
              control={
                <Switch checked={enabled} onChange={event => setEnabled(event.target.checked)} />
              }
              label={t('Enabled')}
              sx={{ mt: 1, minWidth: '120px' }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={autoApprove}
                  onChange={event => setAutoApprove(event.target.checked)}
                />
              }
              label={t('Auto Approve')}
              sx={{ mt: 1, minWidth: '140px' }}
            />
          </Box>

          <TextField
            label={t('Command')}
            value={command}
            onChange={event => {
              setCommand(event.target.value);
              setValidationError('');
            }}
            fullWidth
            required
            helperText={t("Executable command (e.g., 'docker', 'npx', 'python')")}
          />

          <TextField
            label={t('Arguments')}
            value={args}
            onChange={event => {
              setArgs(event.target.value);
              setValidationError('');
            }}
            fullWidth
            multiline
            minRows={2}
            helperText={t(
              'JSON array of command-line arguments. Use HEADLAMP_CURRENT_CLUSTER as a placeholder for the current cluster context.'
            )}
          />

          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Box>
                <Typography variant="subtitle2" component="h3">
                  {t('Environment Variables')}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {t('Use')} <code>HEADLAMP_CURRENT_CLUSTER</code>{' '}
                  {t('as a placeholder for the current cluster context')}
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={handleAddEnvVar}
                startIcon={<Icon icon="mdi:plus" aria-hidden="true" />}
              >
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
                      inputProps={{
                        'aria-label': t('Environment variable {{number}} key', {
                          number: index + 1,
                        }),
                      }}
                      value={envVar.key}
                      onChange={e => handleEnvVarChange(index, 'key', e.target.value)}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label={t('Value')}
                      inputProps={{
                        'aria-label': t('Environment variable {{number}} value', {
                          number: index + 1,
                        }),
                      }}
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
                          ? t('Remove environment variable {{key}}', { key: envVar.key })
                          : t('Remove environment variable {{number}}', { number: index + 1 })
                      }
                    >
                      <Icon icon="mdi:delete" aria-hidden="true" />
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
          {t('Cancel')}
        </Button>
        <Button variant="contained" onClick={handleSave}>
          {isEditing ? t('Save') : t('Add Server')}
        </Button>
      </DialogActions>
    </DialogSlot>
  );
}
