import type { MCPServer, MCPSettings as MCPConfig } from '@headlamp-k8s/ai-common/mcp/types';
import { Icon } from '@iconify/react';
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DefaultDialog, DefaultSectionWrapper } from '../../defaults/DefaultSlots/DefaultSlots';
import MCPConfigEditorDialog from '../MCPConfigEditorDialog/MCPConfigEditorDialog';
import MCPServerEditor from '../MCPServerEditor/MCPServerEditor';

export type { MCPServer } from '@headlamp-k8s/ai-common/mcp/types';
export type { MCPConfig };

/** Interface for an abstract config store that can get and update plugin configuration. */
export interface ConfigStore {
  /** Returns the current stored configuration, or null/undefined if none. */
  get: () => unknown;
  /** Merges the supplied patch into the stored configuration. */
  update: (patch: Record<string, unknown>) => void;
}

const EMPTY_MCP_CONFIG: MCPConfig = { enabled: false, servers: [] };

/** @returns Whether an untrusted value is a non-null object mapping. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** @returns Whether an untrusted value is a mapping containing only string values. */
function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every(item => typeof item === 'string');
}

/** @returns Whether an untrusted value has the persisted MCP config shape. */
function isMCPConfig(value: unknown): value is MCPConfig {
  if (!isRecord(value) || typeof value.enabled !== 'boolean' || !Array.isArray(value.servers)) {
    return false;
  }
  const serverNames = new Set<string>();
  return value.servers.every(server => {
    if (
      !isRecord(server) ||
      typeof server.name !== 'string' ||
      typeof server.command !== 'string' ||
      !Array.isArray(server.args) ||
      !server.args.every(arg => typeof arg === 'string') ||
      typeof server.enabled !== 'boolean'
    ) {
      return false;
    }
    const normalizedName = server.name.trim().toLowerCase();
    if (!normalizedName || serverNames.has(normalizedName)) return false;
    serverNames.add(normalizedName);
    if (server.env !== undefined && !isStringRecord(server.env)) return false;
    return server.autoApprove === undefined || typeof server.autoApprove === 'boolean';
  });
}

/** Reads a valid MCP config from the generic plugin config store. */
function getStoredMCPConfig(configStore: ConfigStore): MCPConfig | null {
  const stored = configStore.get();
  return isRecord(stored) && isMCPConfig(stored.mcpConfig) ? stored.mcpConfig : null;
}

/** Merges MCP settings into the generic plugin config store. */
function updateStoredMCPConfig(configStore: ConfigStore, config: MCPConfig): void {
  const stored = configStore.get();
  configStore.update({ ...(isRecord(stored) ? stored : {}), mcpConfig: config });
}

/** Props for the MCPSettings component. */
export interface MCPSettingsProps {
  /** Callback invoked when the MCP configuration changes. */
  onConfigChange?: (config: MCPConfig) => void;
  /** Whether the app is running in desktop/Electron mode. */
  isRunningAsApp: boolean;
  /** Plugin config store for reading/writing settings. */
  configStore: ConfigStore;
  /** Optional wrapper component for layout (e.g. SectionBox). Falls back to a simple Box with title. */
  SectionWrapper?: React.ComponentType<{ title: string; children: React.ReactNode }>;
  /** Component used to render dialog shells. Falls back to MUI Dialog. */
  DialogSlot?: React.ElementType;
}

/**
 * Manages staged and persisted MCP server settings for desktop Headlamp.
 *
 * @param props - Runtime mode, config store, callbacks, and optional rendering slots.
 * @returns Desktop MCP settings UI or browser-only guidance.
 */
export function MCPSettings({
  onConfigChange,
  isRunningAsApp,
  configStore,
  SectionWrapper = DefaultSectionWrapper,
  DialogSlot = DefaultDialog,
}: MCPSettingsProps): React.ReactElement {
  const { t } = useTranslation();
  const [jsonEditorOpen, setJsonEditorOpen] = useState(false);
  const [serverEditorOpen, setServerEditorOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServer | undefined>(undefined);
  const [mcpConfig, setMCPConfig] = useState<MCPConfig>({
    enabled: false,
    servers: [],
  });
  const [pendingConfig, setPendingConfig] = useState<MCPConfig | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [persistenceError, setPersistenceError] = useState('');
  const [isPersisting, setIsPersisting] = useState(false);
  const persistenceInFlight = React.useRef(false);

  /** Commits one successfully persisted config to local state and the host callback. */
  const commitConfig = React.useCallback(
    (config: MCPConfig): void => {
      setMCPConfig(config);
      setPendingConfig(config);
      setHasUnsavedChanges(false);
      setPersistenceError('');
      onConfigChange?.(config);
    },
    [onConfigChange]
  );

  /** Loads desktop MCP config, falling back to the generic plugin store. */
  const loadMCPConfig = React.useCallback(async (): Promise<void> => {
    const fallbackConfig = getStoredMCPConfig(configStore) ?? EMPTY_MCP_CONFIG;
    if (!isRunningAsApp) {
      setMCPConfig(fallbackConfig);
      setPendingConfig(fallbackConfig);
      setHasUnsavedChanges(false);
      return;
    }

    try {
      const response = await window.desktopApi?.mcp.getConfig();
      const loadedConfig =
        response?.success && isMCPConfig(response.config) ? response.config : fallbackConfig;
      setMCPConfig(loadedConfig);
      setPendingConfig(loadedConfig);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error loading MCP config from Electron:', error);
      setMCPConfig(fallbackConfig);
      setPendingConfig(fallbackConfig);
      setHasUnsavedChanges(false);
    }
  }, [configStore, isRunningAsApp]);

  /** Writes one config while preventing concurrent persistence races. */
  const writeConfig = React.useCallback(
    async (config: MCPConfig): Promise<boolean> => {
      if (persistenceInFlight.current) return false;
      persistenceInFlight.current = true;
      setIsPersisting(true);
      try {
        if (isRunningAsApp) {
          const response = await window.desktopApi?.mcp.updateConfig(config);
          if (!response?.success) {
            console.error('Error updating MCP config in Electron:', response?.error);
            setPersistenceError(t('Failed to save MCP configuration.'));
            return false;
          }
        }
        updateStoredMCPConfig(configStore, config);
        return true;
      } catch (error) {
        console.error('Error updating MCP config:', error);
        setPersistenceError(t('Failed to save MCP configuration.'));
        return false;
      } finally {
        persistenceInFlight.current = false;
        setIsPersisting(false);
      }
    },
    [configStore, isRunningAsApp, t]
  );

  /** Persists one config and commits state only when persistence succeeds. */
  const persistConfig = React.useCallback(
    async (config: MCPConfig): Promise<boolean> => {
      if (!(await writeConfig(config))) return false;
      commitConfig(config);
      return true;
    },
    [commitConfig, writeConfig]
  );

  useEffect(() => {
    void loadMCPConfig();
  }, [loadMCPConfig]);

  /** Persists all staged MCP changes. @returns Save completion. */
  const handleSaveChanges = async (): Promise<void> => {
    if (pendingConfig) await persistConfig(pendingConfig);
  };

  const handleDiscardChanges = (): void => {
    setPendingConfig(mcpConfig);
    setHasUnsavedChanges(false);
    setPersistenceError('');
  };

  const updatePendingConfig = (newConfig: MCPConfig): void => {
    setPendingConfig(newConfig);
    setHasUnsavedChanges(true);
    setPersistenceError('');
  };

  const handleToggleEnabled = async (): Promise<void> => {
    if (!pendingConfig) return;
    const committedConfig = { ...mcpConfig, enabled: !mcpConfig.enabled };
    if (!(await writeConfig(committedConfig))) return;

    setMCPConfig(committedConfig);
    setPendingConfig(currentConfig =>
      currentConfig ? { ...currentConfig, enabled: committedConfig.enabled } : committedConfig
    );
    setPersistenceError('');
    onConfigChange?.(committedConfig);
  };

  const handleOpenServerEditor = (server?: MCPServer): void => {
    setEditingServer(server);
    setServerEditorOpen(true);
  };

  const handleCloseServerEditor = (): void => {
    setServerEditorOpen(false);
    setEditingServer(undefined);
  };

  const handleSaveServer = (server: MCPServer): void => {
    if (!pendingConfig) return;

    let newServers: MCPServer[];

    if (editingServer) {
      const originalServer = pendingConfig.servers.find(s => s.name === editingServer.name);
      const serverChanged =
        !originalServer || JSON.stringify(originalServer) !== JSON.stringify(server);

      if (!serverChanged) {
        return;
      }

      newServers = pendingConfig.servers.map(s => (s.name === editingServer.name ? server : s));
    } else {
      newServers = [...pendingConfig.servers, server];
    }

    const newConfig = { ...pendingConfig, servers: newServers };
    updatePendingConfig(newConfig);
  };

  const handleDeleteServer = (serverName: string): void => {
    if (!pendingConfig) return;
    const newServers = pendingConfig.servers.filter(s => s.name !== serverName);
    const newConfig = { ...pendingConfig, servers: newServers };
    updatePendingConfig(newConfig);
  };

  const handleToggleServerEnabled = (serverName: string): void => {
    if (!pendingConfig) return;
    const newServers = pendingConfig.servers.map(s =>
      s.name === serverName ? { ...s, enabled: !s.enabled } : s
    );
    const newConfig = { ...pendingConfig, servers: newServers };
    updatePendingConfig(newConfig);
  };

  const handleToggleServerAutoApprove = (serverName: string): void => {
    if (!pendingConfig) return;
    const newServers = pendingConfig.servers.map(s =>
      s.name === serverName ? { ...s, autoApprove: s.autoApprove ? undefined : true } : s
    );
    const newConfig = { ...pendingConfig, servers: newServers };
    updatePendingConfig(newConfig);
  };

  const handleSaveConfig = (newConfig: MCPConfig): void => {
    updatePendingConfig(newConfig);
  };

  if (!isRunningAsApp) {
    return (
      <SectionWrapper title={t('MCP Servers')}>
        <Typography variant="body2" color="textSecondary">
          {t('MCP server configuration is only available in the desktop app.')}
        </Typography>
      </SectionWrapper>
    );
  }

  const displayConfig = pendingConfig || mcpConfig;

  return (
    <SectionWrapper title={t('MCP Servers')}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          {t(
            "Model Context Protocol (MCP) allows AI assistants to connect to external tools and data sources. Configure MCP servers here to extend the AI assistant's capabilities."
          )}
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={mcpConfig.enabled}
              onChange={handleToggleEnabled}
              disabled={isPersisting}
              inputProps={{ 'aria-label': t('Enable MCP Servers') }}
            />
          }
          label={t('Enable MCP Servers')}
        />
        {persistenceError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {persistenceError}
          </Alert>
        )}
      </Box>

      {displayConfig.enabled && (
        <>
          {/* Configuration Header */}
          <Box sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" component="h3">
                {t('Configured Servers')}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Button
                  variant="outlined"
                  onClick={() => setJsonEditorOpen(true)}
                  startIcon={<Icon icon="mdi:code-json" aria-hidden="true" />}
                >
                  {t('Edit as JSON')}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleOpenServerEditor()}
                  startIcon={<Icon icon="mdi:plus" aria-hidden="true" />}
                >
                  {t('Add MCP Server')}
                </Button>
              </Box>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="textSecondary">
                {t('{{configured}} configured; {{enabled}} enabled', {
                  configured:
                    displayConfig.servers.length === 1
                      ? t('1 server')
                      : t('{{count}} servers', { count: displayConfig.servers.length }),
                  enabled: displayConfig.servers.filter(server => server.enabled).length,
                })}
                {hasUnsavedChanges && (
                  <Typography component="span" color="warning.main" sx={{ ml: 1 }}>
                    <Box component="span" role="status" aria-live="polite">
                      {t('(Unsaved changes)')}
                    </Box>
                  </Typography>
                )}
              </Typography>
              {hasUnsavedChanges && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Button
                    variant="outlined"
                    onClick={handleDiscardChanges}
                    startIcon={<Icon icon="mdi:cancel" aria-hidden="true" />}
                    size="small"
                  >
                    {t('Discard')}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveChanges}
                    startIcon={<Icon icon="mdi:content-save" aria-hidden="true" />}
                    color="primary"
                    size="small"
                    disabled={isPersisting}
                  >
                    {t('Save Changes')}
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

          {/* Server List Table */}
          {displayConfig.servers.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small" aria-label={t('Configured MCP servers')}>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('Name')}</TableCell>
                    <TableCell align="center">{t('Enabled')}</TableCell>
                    <TableCell align="center">{t('Auto Approve')}</TableCell>
                    <TableCell align="right">{t('Actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayConfig.servers.map(server => (
                    <TableRow key={server.name}>
                      <TableCell>
                        <Typography variant="body2">
                          <strong>{server.name}</strong>
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={server.enabled}
                          onChange={() => handleToggleServerEnabled(server.name)}
                          size="small"
                          inputProps={{
                            'aria-label': t('Enable server {{name}}', { name: server.name }),
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={!!server.autoApprove}
                          onChange={() => handleToggleServerAutoApprove(server.name)}
                          size="small"
                          inputProps={{
                            'aria-label': t('Auto approve server {{name}}', { name: server.name }),
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={t('Edit')}>
                          <IconButton
                            size="small"
                            aria-label={t('Edit server {{name}}', { name: server.name })}
                            onClick={() => handleOpenServerEditor(server)}
                          >
                            <Icon icon="mdi:pencil" aria-hidden="true" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('Delete')}>
                          <IconButton
                            size="small"
                            aria-label={t('Delete server {{name}}', { name: server.name })}
                            onClick={() => handleDeleteServer(server.name)}
                            color="error"
                          >
                            <Icon icon="mdi:delete" aria-hidden="true" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                {t('No MCP servers configured. Click "Add MCP Server" to get started.')}
              </Typography>
            </Paper>
          )}
        </>
      )}

      {/* JSON Editor Dialog */}
      <MCPConfigEditorDialog
        open={jsonEditorOpen}
        onClose={() => setJsonEditorOpen(false)}
        config={displayConfig}
        onSave={handleSaveConfig}
        DialogSlot={DialogSlot}
      />

      {/* Server Editor Dialog */}
      <MCPServerEditor
        open={serverEditorOpen}
        onClose={handleCloseServerEditor}
        server={editingServer}
        onSave={handleSaveServer}
        existingServerNames={displayConfig.servers.map(s => s.name)}
        DialogSlot={DialogSlot}
      />
    </SectionWrapper>
  );
}
