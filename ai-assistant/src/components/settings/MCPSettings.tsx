import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Icon } from '@iconify/react';
import React, { useEffect, useState } from 'react';
import { pluginStore } from '../../utils';

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

const defaultMCPServer: MCPServer = {
  name: '',
  command: 'npx',
  args: [],
  enabled: true,
};

export function MCPSettings({ config, onConfigChange }: MCPSettingsProps) {
  const [mcpConfig, setMCPConfig] = useState<MCPConfig>(
    config || {
      enabled: false,
      servers: [],
    }
  );

  const [newServerName, setNewServerName] = useState('');
  const [newServerCommand, setNewServerCommand] = useState('npx');
  const [newServerArgs, setNewServerArgs] = useState('');

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
    
    // If enabling MCP for the first time and no servers exist, add default Inspektor Gadget server
    if (newConfig.enabled && mcpConfig.servers.length === 0) {
      const defaultServer: MCPServer = {
        name: 'inspektor-gadget',
        command: 'docker',
        args: [
          'run', '-i', '--rm',
          '--mount', 'type=bind,src=%USERPROFILE%\\.kube\\config,dst=/kubeconfig',
          'ghcr.io/inspektor-gadget/ig-mcp-server:latest',
          '-gadget-discoverer=artifacthub'
        ],
        enabled: true,
      };
      
      newConfig.servers = [defaultServer];
    }
    
    await handleConfigChange(newConfig);
  };

  const handleAddServer = () => {
    if (!newServerName.trim() || !newServerCommand.trim()) {
      return;
    }

    const argsArray = newServerArgs.trim() 
      ? newServerArgs.split(' ').map(arg => arg.trim()).filter(arg => arg.length > 0)
      : [];

    const newServer: MCPServer = {
      name: newServerName.trim(),
      command: newServerCommand.trim(),
      args: argsArray,
      enabled: true,
    };

    const newConfig = {
      ...mcpConfig,
      servers: [...mcpConfig.servers, newServer],
    };

    handleConfigChange(newConfig);

    // Clear form
    setNewServerName('');
    setNewServerCommand('npx');
    setNewServerArgs('');
  };

  const handleRemoveServer = (index: number) => {
    const newConfig = {
      ...mcpConfig,
      servers: mcpConfig.servers.filter((_, i) => i !== index),
    };
    handleConfigChange(newConfig);
  };

  const handleToggleServer = (index: number) => {
    const newServers = [...mcpConfig.servers];
    newServers[index] = { ...newServers[index], enabled: !newServers[index].enabled };
    
    const newConfig = { ...mcpConfig, servers: newServers };
    handleConfigChange(newConfig);
  };

  const handleUpdateServer = (index: number, field: keyof MCPServer, value: string | string[]) => {
    const newServers = [...mcpConfig.servers];
    if (field === 'args' && typeof value === 'string') {
      newServers[index] = { 
        ...newServers[index], 
        args: value.split(' ').map(arg => arg.trim()).filter(arg => arg.length > 0)
      };
    } else {
      newServers[index] = { ...newServers[index], [field]: value };
    }
    
    const newConfig = { ...mcpConfig, servers: newServers };
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
          {/* Existing Servers */}
          {mcpConfig.servers.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Configured Servers
              </Typography>
              {mcpConfig.servers.map((server, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={server.enabled}
                            onChange={() => handleToggleServer(index)}
                            size="small"
                          />
                        }
                        label={server.name || `Server ${index + 1}`}
                      />
                      <IconButton
                        onClick={() => handleRemoveServer(index)}
                        color="error"
                        size="small"
                      >
                        <Icon icon="mdi:delete" />
                      </IconButton>
                    </Box>
                    
                    <TextField
                      label="Server Name"
                      value={server.name}
                      onChange={(e) => handleUpdateServer(index, 'name', e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    
                    <TextField
                      label="Command"
                      value={server.command}
                      onChange={(e) => handleUpdateServer(index, 'command', e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    
                    <TextField
                      label="Arguments"
                      value={server.args.join(' ')}
                      onChange={(e) => handleUpdateServer(index, 'args', e.target.value)}
                      fullWidth
                      size="small"
                      helperText="Space-separated arguments"
                    />
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* Add New Server Form */}
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" sx={{ mb: 2 }}>
            Add New MCP Server
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            <TextField
              label="Server Name"
              value={newServerName}
              onChange={(e) => setNewServerName(e.target.value)}
              placeholder="e.g., filesystem"
              size="small"
            />
            
            <TextField
              label="Command"
              value={newServerCommand}
              onChange={(e) => setNewServerCommand(e.target.value)}
              placeholder="e.g., npx"
              size="small"
            />
            
            <TextField
              label="Arguments"
              value={newServerArgs}
              onChange={(e) => setNewServerArgs(e.target.value)}
              placeholder="e.g., -y @danielsuguimoto/readonly-server-filesystem C:\\Users\\username\\Desktop"
              helperText="Space-separated arguments. Use Windows paths like C:\\Users\\username\\Desktop"
              size="small"
              multiline
              rows={2}
            />
          </Box>
          
          <Button
            variant="contained"
            onClick={handleAddServer}
            disabled={!newServerName.trim() || !newServerCommand.trim()}
            startIcon={<Icon icon="mdi:plus" />}
            sx={{ mr: 2 }}
          >
            Add MCP Server
          </Button>

          <Button
            variant="outlined"
            onClick={async () => {
              if (isElectron()) {
                try {
                  const status = await window.desktopApi!.mcp.getStatus();
                  const tools = await window.desktopApi!.mcp.getTools();
                  alert(`MCP Status: ${JSON.stringify(status, null, 2)}\n\nTools: ${tools.tools?.length || 0} available`);
                } catch (error) {
                  alert(`Error testing MCP: ${error}`);
                }
              }
            }}
            startIcon={<Icon icon="mdi:test-tube" />}
          >
            Test MCP Connection
          </Button>

          {/* Example Configuration */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Example Configuration for Windows:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
              {JSON.stringify({
                "Server Name": "filesystem",
                "Command": "npx",
                "Arguments": "-y @danielsuguimoto/readonly-server-filesystem C:\\Users\\username\\Desktop C:\\Users\\username\\Documents"
              }, null, 2)}
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
              Make sure to use actual Windows paths that exist on your system.
            </Typography>
          </Box>

          {/* Troubleshooting Section */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              📋 Troubleshooting Tips:
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • Use the "Test MCP Connection" button to check if servers are running
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • Check Electron DevTools Console (F12) for error messages
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              • Ensure NPM packages can be installed: run `npm install -g @danielsuguimoto/readonly-server-filesystem` first
            </Typography>
            <Typography variant="body2">
              • Use existing Windows paths like `C:\Users\[username]\Desktop`
            </Typography>
          </Box>
        </>
      )}
    </SectionBox>
  );
}
