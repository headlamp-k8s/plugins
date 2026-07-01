import { Icon } from '@iconify/react';
import {
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
  /** Whether tool calls from this server skip the approval prompt. */
  autoApprove?: boolean;
}

/** Top-level MCP configuration containing global enablement and server list. */
export interface MCPConfig {
  /** Whether MCP functionality is globally enabled. */
  enabled: boolean;
  /** List of configured MCP servers. */
  servers: MCPServer[];
}

/** Interface for an abstract config store that can get and update plugin configuration. */
export interface ConfigStore {
  /** Returns the current stored configuration, or null/undefined if none. */
  get: () => any | null | undefined;
  /** Merges the supplied patch into the stored configuration. */
  update: (patch: any) => void;
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

export function MCPSettings({
  onConfigChange,
  isRunningAsApp,
  configStore,
  SectionWrapper = DefaultSectionWrapper,
  DialogSlot = DefaultDialog,
}: MCPSettingsProps) {
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

  useEffect(() => {
    if (isRunningAsApp) {
      loadMCPConfigFromElectron();
    } else {
      const savedConfig = configStore.get();
      if (savedConfig?.mcpConfig) {
        setMCPConfig(savedConfig.mcpConfig);
      }
    }
  }, []);

  const loadMCPConfigFromElectron = async () => {
    if (!isRunningAsApp) return;

    try {
      const response = await window.desktopApi!.mcp.getConfig();
      if (response.success && response.config) {
        setMCPConfig(response.config);
        setPendingConfig(response.config);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error loading MCP config from Electron:', error);
      const savedConfig = configStore.get();
      if (savedConfig?.mcpConfig) {
        setMCPConfig(savedConfig.mcpConfig);
        setPendingConfig(savedConfig.mcpConfig);
        setHasUnsavedChanges(false);
      }
    }
  };

  const handleSaveChanges = async () => {
    if (!pendingConfig) return;

    if (isRunningAsApp) {
      try {
        const response = await window.desktopApi!.mcp.updateConfig(pendingConfig);
        if (response.success) {
          await loadMCPConfigFromElectron();
          const currentConfig = configStore.get() || {};
          configStore.update({
            ...currentConfig,
            mcpConfig: pendingConfig,
          });
        } else {
          console.error('Error updating MCP config in Electron:', response.error);
        }
      } catch (error) {
        console.error('Error updating MCP config:', error);
      }
    } else {
      const currentConfig = configStore.get() || {};
      configStore.update({
        ...currentConfig,
        mcpConfig: pendingConfig,
      });
      const updatedConfig = configStore.get();
      if (updatedConfig?.mcpConfig) {
        setMCPConfig(updatedConfig.mcpConfig);
        setPendingConfig(updatedConfig.mcpConfig);
        setHasUnsavedChanges(false);
      }
    }

    if (onConfigChange) {
      onConfigChange(pendingConfig);
    }
  };

  const handleDiscardChanges = () => {
    setPendingConfig(mcpConfig);
    setHasUnsavedChanges(false);
  };

  const updatePendingConfig = (newConfig: MCPConfig) => {
    setPendingConfig(newConfig);
    setHasUnsavedChanges(true);
  };

  const handleToggleEnabled = async () => {
    console.log('Toggling MCP enabled state', pendingConfig);
    if (!pendingConfig) return;
    const newConfig = { ...mcpConfig, enabled: !mcpConfig.enabled };

    if (isRunningAsApp) {
      try {
        const response = await window.desktopApi!.mcp.updateConfig(newConfig);
        if (response.success) {
          await loadMCPConfigFromElectron();
          const currentConfig = configStore.get() || {};
          configStore.update({
            ...currentConfig,
            mcpConfig: newConfig,
          });
        } else {
          console.error('Error updating MCP config in Electron:', response.error);
        }
      } catch (error) {
        console.error('Error updating MCP config:', error);
      }
    } else {
      const currentConfig = configStore.get() || {};
      configStore.update({
        ...currentConfig,
        mcpConfig: newConfig,
      });
      const updatedConfig = configStore.get();
      if (updatedConfig?.mcpConfig) {
        setMCPConfig(updatedConfig.mcpConfig);
        setPendingConfig(updatedConfig.mcpConfig);
        setHasUnsavedChanges(false);
      }
    }

    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  const handleOpenServerEditor = (server?: MCPServer) => {
    setEditingServer(server);
    setServerEditorOpen(true);
  };

  const handleCloseServerEditor = () => {
    setServerEditorOpen(false);
    setEditingServer(undefined);
  };

  const handleSaveServer = (server: MCPServer) => {
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

  const handleDeleteServer = (serverName: string) => {
    if (!pendingConfig) return;
    const newServers = pendingConfig.servers.filter(s => s.name !== serverName);
    const newConfig = { ...pendingConfig, servers: newServers };
    updatePendingConfig(newConfig);
  };

  const handleToggleServerEnabled = (serverName: string) => {
    if (!pendingConfig) return;
    const newServers = pendingConfig.servers.map(s =>
      s.name === serverName ? { ...s, enabled: !s.enabled } : s
    );
    const newConfig = { ...pendingConfig, servers: newServers };
    updatePendingConfig(newConfig);
  };

  const handleToggleServerAutoApprove = (serverName: string) => {
    if (!pendingConfig) return;
    const newServers = pendingConfig.servers.map(s =>
      s.name === serverName ? { ...s, autoApprove: s.autoApprove ? undefined : true } : s
    );
    const newConfig = { ...pendingConfig, servers: newServers };
    updatePendingConfig(newConfig);
  };

  const handleSaveConfig = (newConfig: MCPConfig) => {
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
          Model Context Protocol (MCP) allows AI assistants to connect to external tools and data
          sources. Configure MCP servers here to extend the AI assistant's capabilities.
        </Typography>

        <FormControlLabel
          control={<Switch checked={mcpConfig.enabled} onChange={handleToggleEnabled} />}
          label={t('Enable MCP Servers')}
        />
      </Box>

      {displayConfig.enabled && (
        <>
          {/* Configuration Header */}
          <Box sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">{t('Configured Servers')}</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Button
                  variant="outlined"
                  onClick={() => setJsonEditorOpen(true)}
                  startIcon={<Icon icon="mdi:code-json" />}
                >
                  {t('Edit as JSON')}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleOpenServerEditor()}
                  startIcon={<Icon icon="mdi:plus" />}
                >
                  {t('Add MCP Server')}
                </Button>
              </Box>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="textSecondary">
                {displayConfig.servers.length} server(s) configured,{' '}
                {displayConfig.servers.filter(s => s.enabled).length} enabled.
                {hasUnsavedChanges && (
                  <Typography component="span" color="warning.main" sx={{ ml: 1 }}>
                    (Unsaved changes)
                  </Typography>
                )}
              </Typography>
              {hasUnsavedChanges && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Button
                    variant="outlined"
                    onClick={handleDiscardChanges}
                    startIcon={<Icon icon="mdi:cancel" />}
                    size="small"
                  >
                    Discard
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveChanges}
                    startIcon={<Icon icon="mdi:content-save" />}
                    color="primary"
                    size="small"
                  >
                    Save Changes
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

          {/* Server List Table */}
          {displayConfig.servers.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('Name')}</TableCell>
                    <TableCell align="center">{t('Enabled')}</TableCell>
                    <TableCell align="center">{t('Auto Approve')}</TableCell>
                    <TableCell align="right">{t('Actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayConfig.servers.map((server, index) => (
                    <TableRow key={index}>
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
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={!!server.autoApprove}
                          onChange={() => handleToggleServerAutoApprove(server.name)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={t('Edit')}>
                          <IconButton size="small" onClick={() => handleOpenServerEditor(server)}>
                            <Icon icon="mdi:pencil" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('Delete')}>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteServer(server.name)}
                            color="error"
                          >
                            <Icon icon="mdi:delete" />
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
                {t('No MCP servers configured. Click "Add Server" to get started.')}
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
