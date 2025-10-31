import { Icon } from '@iconify/react';
import { Headlamp } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
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
import { pluginStore } from '../../utils';
import MCPConfigEditorDialog from './MCPConfigEditorDialog';
import MCPServerEditor from './MCPServerEditor';

export interface MCPServer {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled: boolean;
}

export interface MCPConfig {
  enabled: boolean;
  servers: MCPServer[];
}

interface MCPSettingsProps {
  config?: MCPConfig;
  onConfigChange?: (config: MCPConfig) => void;
}

export function MCPSettings({ config, onConfigChange }: MCPSettingsProps) {
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
    // Load MCP config from Electron if available
    if (Headlamp.isRunningAsApp()) {
      loadMCPConfigFromElectron();
    } else {
      // Fallback to plugin store for non-Electron environments
      const savedConfig = pluginStore.get();
      if (savedConfig?.mcpConfig) {
        setMCPConfig(savedConfig.mcpConfig);
      }
    }
  }, []);

  const loadMCPConfigFromElectron = async () => {
    if (!Headlamp.isRunningAsApp()) return;

    try {
      const response = await window.desktopApi!.mcp.getConfig();
      if (response.success && response.config) {
        setMCPConfig(response.config);
        setPendingConfig(response.config);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error loading MCP config from Electron:', error);
      // Fallback to plugin store
      const savedConfig = pluginStore.get();
      if (savedConfig?.mcpConfig) {
        setMCPConfig(savedConfig.mcpConfig);
        setPendingConfig(savedConfig.mcpConfig);
        setHasUnsavedChanges(false);
      }
    }
  };

  const handleSaveChanges = async () => {
    if (!pendingConfig) return;

    if (Headlamp.isRunningAsApp()) {
      // Save to Electron settings and restart MCP client
      try {
        const response = await window.desktopApi!.mcp.updateConfig(pendingConfig);
        if (response.success) {
          // Reload config from Electron after successful update
          await loadMCPConfigFromElectron();
        } else {
          console.error('Error updating MCP config in Electron:', response.error);
        }
      } catch (error) {
        console.error('Error updating MCP config:', error);
      }
    } else {
      // Save to plugin store for non-Electron environments
      const currentConfig = pluginStore.get() || {};
      pluginStore.update({
        ...currentConfig,
        mcpConfig: pendingConfig,
      });
      // Update local state from plugin store
      const updatedConfig = pluginStore.get();
      if (updatedConfig?.mcpConfig) {
        setMCPConfig(updatedConfig.mcpConfig);
        setPendingConfig(updatedConfig.mcpConfig);
        setHasUnsavedChanges(false);
      }
    }

    // Notify parent if callback provided
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
    if (!pendingConfig) return;
    const newConfig = { ...mcpConfig, enabled: !mcpConfig.enabled };

    // If enabling MCP for the first time and no servers exist, add default servers
    if (newConfig.enabled && mcpConfig.servers.length === 0) {
      const defaultServers: MCPServer[] = [
        {
          name: 'inspektor-gadget',
          command: 'docker',
          args: ['mcp', 'gateway', 'run'],
          enabled: true,
        },
        {
          name: 'flux-mcp',
          command: 'flux-operator-mcp',
          args: ['serve'],
          env: {
            KUBECONFIG: '/Users/ashughildiyal/.kube/config',
          },
          enabled: true,
        },
      ];

      newConfig.servers = defaultServers;
    }

    // Immediately save this change (bypass pending state)
    if (Headlamp.isRunningAsApp()) {
      try {
        const response = await window.desktopApi!.mcp.updateConfig(newConfig);
        if (response.success) {
          await loadMCPConfigFromElectron();
        } else {
          console.error('Error updating MCP config in Electron:', response.error);
        }
      } catch (error) {
        console.error('Error updating MCP config:', error);
      }
    } else {
      const currentConfig = pluginStore.get() || {};
      pluginStore.update({
        ...currentConfig,
        mcpConfig: newConfig,
      });
      const updatedConfig = pluginStore.get();
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
      // Check if the server actually changed
      const originalServer = pendingConfig.servers.find(s => s.name === editingServer.name);
      const serverChanged = !originalServer || JSON.stringify(originalServer) !== JSON.stringify(server);
      
      if (!serverChanged) {
        // No changes, just close the dialog
        return;
      }
      
      // Update existing server
      newServers = pendingConfig.servers.map(s => (s.name === editingServer.name ? server : s));
    } else {
      // Add new server
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

  const handleSaveConfig = (newConfig: MCPConfig) => {
    updatePendingConfig(newConfig);
  };

  // Only show MCP settings in Electron
  if (!Headlamp.isRunningAsApp()) {
    return (
      <SectionBox title="MCP Servers">
        <Typography variant="body2" color="textSecondary">
          MCP server configuration is only available in the desktop app.
        </Typography>
      </SectionBox>
    );
  }

  const displayConfig = pendingConfig || mcpConfig;

  return (
    <SectionBox title="MCP Servers">
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Model Context Protocol (MCP) allows AI assistants to connect to external tools and data
          sources. Configure MCP servers here to extend the AI assistant's capabilities.
        </Typography>

        <FormControlLabel
          control={<Switch checked={mcpConfig.enabled} onChange={handleToggleEnabled} />}
          label="Enable MCP Servers"
        />
      </Box>

      {displayConfig.enabled && (
        <>
          {/* Configuration Header */}
          <Box sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Configured Servers</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Button
                  variant="outlined"
                  onClick={() => setJsonEditorOpen(true)}
                  startIcon={<Icon icon="mdi:code-json" />}
                >
                  Edit as JSON
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleOpenServerEditor()}
                  startIcon={<Icon icon="mdi:plus" />}
                >
                  Add MCP Server
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
                    <TableCell>Name</TableCell>
                    <TableCell align="center">Enabled</TableCell>
                    <TableCell align="right">Actions</TableCell>
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
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenServerEditor(server)}
                          >
                            <Icon icon="mdi:pencil" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
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
                No MCP servers configured. Click "Add Server" to get started.
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
      />

      {/* Server Editor Dialog */}
      <MCPServerEditor
        open={serverEditorOpen}
        onClose={handleCloseServerEditor}
        server={editingServer}
        onSave={handleSaveServer}
        existingServerNames={displayConfig.servers.map(s => s.name)}
      />
    </SectionBox>
  );
}
