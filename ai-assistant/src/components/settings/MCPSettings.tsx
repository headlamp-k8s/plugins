import { Icon } from '@iconify/react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import {
  Box,
  Button,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { pluginStore } from '../../utils';
import MCPConfigEditorDialog from './MCPConfigEditorDialog';

// Helper function to check if running in Electron
const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.desktopApi !== 'undefined' && 
         typeof window.desktopApi.mcp !== 'undefined';
};

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
  const [mcpConfig, setMCPConfig] = useState<MCPConfig>(
    config || {
      enabled: false,
      servers: [],
    }
  );

  const [editorDialogOpen, setEditorDialogOpen] = useState(false);

  useEffect(() => {
    // Load MCP config from Electron if available
    if (isElectron()) {
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
    if (!isElectron()) return;
    
    try {
      const response = await window.desktopApi!.mcp.getConfig();
      if (response.success && response.config) {
        setMCPConfig(response.config);
      }
    } catch (error) {
      console.error('Error loading MCP config from Electron:', error);
      // Fallback to plugin store
      const savedConfig = pluginStore.get();
      if (savedConfig?.mcpConfig) {
        setMCPConfig(savedConfig.mcpConfig);
      }
    }
  };

  const handleConfigChange = async (newConfig: MCPConfig) => {
    setMCPConfig(newConfig);
    
    if (isElectron()) {
      // Save to Electron settings and restart MCP client
      try {
        const response = await window.desktopApi!.mcp.updateConfig(newConfig);
        if (!response.success) {
          console.error('Error updating MCP config in Electron:', response.error);
          // Still save to plugin store as fallback
          const currentConfig = pluginStore.get() || {};
          pluginStore.update({
            ...currentConfig,
            mcpConfig: newConfig,
          });
        }
      } catch (error) {
        console.error('Error updating MCP config:', error);
        // Fallback to plugin store
        const currentConfig = pluginStore.get() || {};
        pluginStore.update({
          ...currentConfig,
          mcpConfig: newConfig,
        });
      }
    } else {
      // Save to plugin store for non-Electron environments
      const currentConfig = pluginStore.get() || {};
      pluginStore.update({
        ...currentConfig,
        mcpConfig: newConfig,
      });
    }

    // Also notify parent if callback provided
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  const handleToggleEnabled = async () => {
    const newConfig = { ...mcpConfig, enabled: !mcpConfig.enabled };
    
    // If enabling MCP for the first time and no servers exist, add default servers
    if (newConfig.enabled && mcpConfig.servers.length === 0) {
      const defaultServers: MCPServer[] = [
        {
          name: 'inspektor-gadget',
          command: 'docker',
          args: [
            'mcp',
            'gateway',
            'run'
          ],
          enabled: true,
        },
        {
          name: 'flux-mcp',
          command: 'flux-operator-mcp',
          args: [
            'serve'
          ],
          env: {
            'KUBECONFIG': '/Users/ashughildiyal/.kube/config'
          },
          enabled: true,
        }
      ];

      newConfig.servers = defaultServers;
    }
    
    await handleConfigChange(newConfig);
  };



  const handleOpenEditorDialog = () => {
    setEditorDialogOpen(true);
  };

  const handleCloseEditorDialog = () => {
    setEditorDialogOpen(false);
  };

  const handleSaveConfig = (newConfig: MCPConfig) => {
    handleConfigChange(newConfig);
  };

  // Only show MCP settings in Electron
  if (!isElectron()) {
    return (
      <SectionBox title="MCP Servers">
        <Typography variant="body2" color="textSecondary">
          MCP server configuration is only available in the desktop app.
        </Typography>
      </SectionBox>
    );
  }

  return (
    <SectionBox title="MCP Servers">
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Model Context Protocol (MCP) allows AI assistants to connect to external tools and data sources.
          Configure MCP servers here to extend the AI assistant's capabilities.
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={mcpConfig.enabled}
              onChange={handleToggleEnabled}
            />
          }
          label="Enable MCP Servers"
        />
      </Box>

      {mcpConfig.enabled && (
        <>
          {/* Configuration Summary */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Server Configuration
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              You have {mcpConfig.servers.length} server(s) configured.
              {mcpConfig.servers.filter(s => s.enabled).length} server(s) are currently enabled.
            </Typography>

            <Button
              variant="contained"
              onClick={handleOpenEditorDialog}
              startIcon={<Icon icon="mdi:pencil" />}
            >
              Edit Configuration
            </Button>
          </Box>

          {/* Server List Summary */}
          {mcpConfig.servers.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Configured Servers:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                {mcpConfig.servers.map((server, index) => (
                  <li key={index}>
                    <Typography variant="body2">
                      <strong>{server.name}</strong> ({server.command}) -
                      <span style={{ color: server.enabled ? 'green' : 'red', marginLeft: '8px' }}>
                        {server.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      {server.env && (
                        <span style={{ marginLeft: '8px', fontStyle: 'italic' }}>
                          (with env variables)
                        </span>
                      )}
                    </Typography>
                  </li>
                ))}
              </Box>
            </Box>
          )}
        </>
      )}

      {/* Editor Dialog */}
      <MCPConfigEditorDialog
        open={editorDialogOpen}
        onClose={handleCloseEditorDialog}
        config={mcpConfig}
        onSave={handleSaveConfig}
      />
    </SectionBox>
  );
}
