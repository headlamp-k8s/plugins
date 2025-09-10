import { Icon } from '@iconify/react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { pluginStore } from '../../utils';

// Helper function to check if running in Electron
const isElectron = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    typeof window.desktopApi !== 'undefined' &&
    typeof window.desktopApi.mcp !== 'undefined'
  );
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

// @todo: this is unused?
// const defaultMCPServer: MCPServer = {
//   name: '',
//   command: 'npx',
//   args: [],
//   enabled: true,
// };

export function MCPSettings({ config, onConfigChange }: MCPSettingsProps) {
  const [mcpConfig, setMCPConfig] = useState<MCPConfig>(
    config || {
      enabled: false,
      servers: [],
    }
  );

  const [jsonConfig, setJsonConfig] = useState('');
  const [jsonError, setJsonError] = useState('');

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

  // Update JSON config when mcpConfig changes
  useEffect(() => {
    setJsonConfig(JSON.stringify(mcpConfig, null, 2));
  }, [mcpConfig]);

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
            'run', '-i', '--rm',
            '--mount', 'type=bind,src=%USERPROFILE%\\.kube\\config,dst=/root/.kube/config,readonly',
            '--mount', 'type=bind,src=%USERPROFILE%\\.minikube,dst=/root/.minikube,readonly',
            'ghcr.io/inspektor-gadget/ig-mcp-server:latest',
            '-gadget-discoverer=artifacthub'
          ],
          enabled: false, // Disabled by default to avoid errors
        },
        {
          name: 'filesystem',
          command: 'npx',
          args: [
            '-y', '@danielsuguimoto/readonly-server-filesystem',
            'C:\\Users\\' + (process.env.USERNAME || 'username') + '\\Desktop'
          ],
          enabled: true,
        }
      ];
      
      newConfig.servers = defaultServers;
    }

    await handleConfigChange(newConfig);
  };



  const handleJsonConfigChange = (value: string) => {
    setJsonConfig(value);
    setJsonError('');
  };

  const validateAndApplyJsonConfig = () => {
    try {
      const parsedConfig = JSON.parse(jsonConfig) as MCPConfig;
      
      // Validate the structure
      if (typeof parsedConfig.enabled !== 'boolean') {
        throw new Error('enabled field must be a boolean');
      }
      
      if (!Array.isArray(parsedConfig.servers)) {
        throw new Error('servers field must be an array');
      }
      
      // Validate each server
      parsedConfig.servers.forEach((server, index) => {
        if (typeof server.name !== 'string') {
          throw new Error(`Server ${index}: name must be a string`);
        }
        if (typeof server.command !== 'string') {
          throw new Error(`Server ${index}: command must be a string`);
        }
        if (!Array.isArray(server.args)) {
          throw new Error(`Server ${index}: args must be an array`);
        }
        if (typeof server.enabled !== 'boolean') {
          throw new Error(`Server ${index}: enabled must be a boolean`);
        }
      });
      
      // Apply the config
      handleConfigChange(parsedConfig);
      setJsonError('');
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON configuration');
    }
  };

<<<<<<< HEAD
    const argsArray = newServerArgs.trim()
      ? newServerArgs
          .split(' ')
          .map(arg => arg.trim())
          .filter(arg => arg.length > 0)
      : [];
=======
  const resetJsonToCurrentConfig = () => {
    setJsonConfig(JSON.stringify(mcpConfig, null, 2));
    setJsonError('');
  };
>>>>>>> 98e370c (ai-plugin: Fix tool response and update MCPSettings)

  const getExampleConfig = (): MCPConfig => {
    return {
      enabled: true,
      servers: [
        {
          name: "inspektor-gadget",
          command: "docker",
          args: [
            "run", "-i", "--rm",
            "--mount", "type=bind,src=%USERPROFILE%\\.kube\\config,dst=/root/.kube/config,readonly",
            "--mount", "type=bind,src=%USERPROFILE%\\.minikube,dst=/root/.minikube,readonly",
            "ghcr.io/inspektor-gadget/ig-mcp-server:latest",
            "-gadget-discoverer=artifacthub"
          ],
          enabled: false
        },
        {
          name: "filesystem",
          command: "npx",
          args: [
            "-y", "@danielsuguimoto/readonly-server-filesystem",
            "C:\\Users\\username\\Desktop",
            "C:\\Users\\username\\Documents"
          ],
          enabled: true
        }
      ]
    };
  };

<<<<<<< HEAD
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
        args: value
          .split(' ')
          .map(arg => arg.trim())
          .filter(arg => arg.length > 0),
      };
    } else {
      newServers[index] = { ...newServers[index], [field]: value };
    }

    const newConfig = { ...mcpConfig, servers: newServers };
    handleConfigChange(newConfig);
=======
  const loadExampleConfig = () => {
    const exampleConfig = getExampleConfig();
    setJsonConfig(JSON.stringify(exampleConfig, null, 2));
    setJsonError('');
>>>>>>> 98e370c (ai-plugin: Fix tool response and update MCPSettings)
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
          Model Context Protocol (MCP) allows AI assistants to connect to external tools and data
          sources. Configure MCP servers here to extend the AI assistant's capabilities.
        </Typography>

        <FormControlLabel
          control={<Switch checked={mcpConfig.enabled} onChange={handleToggleEnabled} />}
          label="Enable MCP Servers"
        />
      </Box>

      {mcpConfig.enabled && (
        <>
<<<<<<< HEAD
          {/* Existing Servers */}
          {mcpConfig.servers.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Configured Servers
              </Typography>
              {mcpConfig.servers.map((server, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
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
                      onChange={e => handleUpdateServer(index, 'name', e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ mb: 1 }}
                    />

                    <TextField
                      label="Command"
                      value={server.command}
                      onChange={e => handleUpdateServer(index, 'command', e.target.value)}
                      fullWidth
                      size="small"
                      sx={{ mb: 1 }}
                    />

                    <TextField
                      label="Arguments"
                      value={server.args.join(' ')}
                      onChange={e => handleUpdateServer(index, 'args', e.target.value)}
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
              onChange={e => setNewServerName(e.target.value)}
              placeholder="e.g., filesystem"
              size="small"
            />

            <TextField
              label="Command"
              value={newServerCommand}
              onChange={e => setNewServerCommand(e.target.value)}
              placeholder="e.g., npx"
              size="small"
            />

            <TextField
              label="Arguments"
              value={newServerArgs}
              onChange={e => setNewServerArgs(e.target.value)}
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
                  alert(
                    `MCP Status: ${JSON.stringify(status, null, 2)}\n\nTools: ${
                      tools.tools?.length || 0
                    } available`
                  );
                } catch (error) {
                  alert(`Error testing MCP: ${error}`);
=======
          {/* JSON Configuration */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              JSON Configuration Editor
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Edit your MCP servers configuration as JSON. This allows you to easily add, remove, 
              and modify multiple servers at once.
            </Typography>
            
            {jsonError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {jsonError}
              </Alert>
            )}
            
            <TextField
              label="MCP Configuration JSON"
              value={jsonConfig}
              onChange={(e) => handleJsonConfigChange(e.target.value)}
              multiline
              rows={15}
              fullWidth
              variant="outlined"
              sx={{ 
                mb: 2,
                '& .MuiInputBase-input': {
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
>>>>>>> 98e370c (ai-plugin: Fix tool response and update MCPSettings)
                }
              }}
              helperText="Edit the JSON configuration above. Make sure to keep the proper structure."
            />
            
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                onClick={validateAndApplyJsonConfig}
                startIcon={<Icon icon="mdi:check" />}
              >
                Apply Configuration
              </Button>
              <Button
                variant="outlined"
                onClick={resetJsonToCurrentConfig}
                startIcon={<Icon icon="mdi:refresh" />}
              >
                Reset to Current
              </Button>
              <Button
                variant="outlined"
                onClick={loadExampleConfig}
                startIcon={<Icon icon="mdi:file-document" />}
              >
                Load Example
              </Button>
            </Box>

<<<<<<< HEAD
          {/* Example Configuration */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Example Configuration for Windows:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
              {JSON.stringify(
                {
                  'Server Name': 'filesystem',
                  Command: 'npx',
                  Arguments:
                    '-y @danielsuguimoto/readonly-server-filesystem C:\\Users\\username\\Desktop C:\\Users\\username\\Documents',
                },
                null,
                2
              )}
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
              • Ensure NPM packages can be installed: run `npm install -g
              @danielsuguimoto/readonly-server-filesystem` first
            </Typography>
            <Typography variant="body2">
              • Use existing Windows paths like `C:\Users\[username]\Desktop`
            </Typography>
          </Box>
        </>
      )}
=======
            {/* Schema Documentation */}
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                📝 Configuration Schema:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', mb: 1 }}>
                {JSON.stringify({
                  "enabled": "boolean - Enable/disable MCP servers",
                  "servers": [
                    {
                      "name": "string - Unique server name",
                      "command": "string - Executable command",
                      "args": ["array of strings - Command arguments"],
                      "enabled": "boolean - Enable/disable this server"
                    }
                  ]
                }, null, 2)}
              </Typography>
            </Box>

            </Box>
            </>)}
>>>>>>> 98e370c (ai-plugin: Fix tool response and update MCPSettings)
    </SectionBox>
  );
}
