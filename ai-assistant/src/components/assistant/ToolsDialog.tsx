import { Icon } from '@iconify/react';
import { Dialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { ElectronMCPClient } from '../../ai/mcp/electron-client';
import { AVAILABLE_TOOLS } from '../../langchain/tools/registry';

interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: any;
  server?: string;
}

interface ToolsDialogProps {
  open: boolean;
  onClose: () => void;
  enabledTools: string[];
  onToolsChange: (enabledTools: string[]) => void;
}

export const ToolsDialog: React.FC<ToolsDialogProps> = ({
  open,
  onClose,
  enabledTools,
  onToolsChange,
}) => {
  const [localEnabledTools, setLocalEnabledTools] = useState<string[]>(enabledTools);
  const [allKnownMcpTools, setAllKnownMcpTools] = useState<MCPTool[]>([]); // Track all tools ever seen
  const [mcpToolsConfig, setMcpToolsConfig] = useState<any>({});
  const [originalMcpConfig, setOriginalMcpConfig] = useState<any>({});
  const [isLoadingMcp, setIsLoadingMcp] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());
  const [, setMcpServers] = useState<{ [key: string]: any }>({});

  // Load MCP tools when dialog opens
  useEffect(() => {
    if (open) {
      loadMcpTools();
    }
  }, [open]);

  // Sync local state when enabledTools prop changes
  useEffect(() => {
    setLocalEnabledTools(enabledTools);
  }, [enabledTools]);

  // Parse MCP tool name to extract server and tool components
  const parseMcpToolName = (fullToolName: string): { serverName: string; toolName: string } => {
    const parts = fullToolName.split('__');
    if (parts.length >= 2) {
      return {
        serverName: parts[0],
        toolName: parts.slice(1).join('__'),
      };
    }
    return {
      serverName: 'default',
      toolName: fullToolName,
    };
  };

  // Check if an MCP tool is enabled in the configuration
  const isMcpToolEnabled = (toolName: string): boolean => {
    const { serverName, toolName: actualToolName } = parseMcpToolName(toolName);
    const serverConfig = mcpToolsConfig[serverName];
    if (!serverConfig || !serverConfig[actualToolName]) {
      return true; // Default to enabled for new tools
    }
    return serverConfig[actualToolName].enabled !== false;
  };

  const loadMcpTools = async () => {
    console.log('ToolsDialog: Starting to load MCP tools...');
    setIsLoadingMcp(true);
    try {
      const mcpClient = new ElectronMCPClient();
      console.log('ToolsDialog: Created MCP client, isAvailable:', mcpClient.isAvailable());

      // Load tools, server configuration, and tools configuration
      const [tools, configResponse, toolsConfigResponse] = await Promise.all([
        mcpClient.getTools(),
        mcpClient.getConfig(),
        mcpClient.getToolsConfig(),
      ]);

      console.log('ToolsDialog: Received tools from client:', tools.length, 'tools');
      console.log('ToolsDialog: Tools:', tools);
      console.log('ToolsDialog: Config response:', configResponse);
      console.log('ToolsDialog: Tools config response:', toolsConfigResponse);

      // Store MCP tools configuration
      if (toolsConfigResponse.success && toolsConfigResponse.config) {
        setMcpToolsConfig(toolsConfigResponse.config);
        setOriginalMcpConfig(JSON.parse(JSON.stringify(toolsConfigResponse.config)));
      }

      // Extract server names from config
      let servers: { [key: string]: any } = {};
      if (configResponse.success && configResponse.config && configResponse.config.servers) {
        servers = configResponse.config.servers.reduce(
          (acc: { [key: string]: any }, server: any) => {
            acc[server.name] = server;
            return acc;
          },
          {}
        );
        setMcpServers(servers);
      }

      // Assign server names to tools based on available servers
      // If we have server config, try to match tools to servers
      // For now, if there's only one enabled server, assign all tools to it
      const enabledServers = Object.values(servers).filter((server: any) => server.enabled);
      const toolsWithServer = tools.map(tool => {
        if (tool.server) {
          return tool; // Tool already has server info
        }

        // If we have exactly one enabled server, assign all tools to it
        if (enabledServers.length === 1) {
          return { ...tool, server: enabledServers[0].name };
        }

        // Otherwise, try to infer from tool name or keep as unknown
        const serverNames = Object.keys(servers);
        for (const serverName of serverNames) {
          if (tool.name.toLowerCase().includes(serverName.toLowerCase().replace('-mcp', ''))) {
            return { ...tool, server: serverName };
          }
        }

        return { ...tool, server: 'Unknown Server' };
      });

      // Update allKnownMcpTools by merging new tools with existing ones
      setAllKnownMcpTools(prevKnown => {
        const knownToolNames = new Set(prevKnown.map(t => t.name));
        const newTools = toolsWithServer.filter(t => !knownToolNames.has(t.name));
        return [...prevKnown, ...newTools];
      });

      // Auto-expand servers that have tools
      const serversWithTools = new Set<string>();
      toolsWithServer.forEach(tool => {
        if (tool.server) {
          serversWithTools.add(tool.server);
        }
      });
      setExpandedServers(serversWithTools);
    } catch (error) {
      console.error('ToolsDialog: Failed to load MCP tools:', error);
      setMcpServers({});
    } finally {
      setIsLoadingMcp(false);
    }
  };

  const handleToggleRegularTool = (toolName: string) => {
    setLocalEnabledTools(prevTools => {
      if (prevTools.includes(toolName)) {
        return prevTools.filter(tool => tool !== toolName);
      } else {
        return [...prevTools, toolName];
      }
    });
  };

  const handleToggleMcpTool = (toolName: string) => {
    const { serverName, toolName: actualToolName } = parseMcpToolName(toolName);
    const currentlyEnabled = isMcpToolEnabled(toolName);
    
    setMcpToolsConfig((prevConfig: any) => {
      const newConfig = { ...prevConfig };
      if (!newConfig[serverName]) {
        newConfig[serverName] = {};
      }
      if (!newConfig[serverName][actualToolName]) {
        newConfig[serverName][actualToolName] = {
          enabled: true,
          usageCount: 0,
        };
      }
      newConfig[serverName][actualToolName].enabled = !currentlyEnabled;
      return newConfig;
    });
  };

  const handleToggleServer = (serverName: string) => {
    const serverTools = allKnownMcpTools.filter(tool => tool.server === serverName);
    
    // Check if all tools from this server are currently enabled
    const allEnabled = serverTools.every(tool => isMcpToolEnabled(tool.name));

    // Update MCP configuration for all tools in this server
    setMcpToolsConfig((prevConfig: any) => {
      const newConfig = { ...prevConfig };
      if (!newConfig[serverName]) {
        newConfig[serverName] = {};
      }

      serverTools.forEach(tool => {
        const { toolName: actualToolName } = parseMcpToolName(tool.name);
        if (!newConfig[serverName][actualToolName]) {
          newConfig[serverName][actualToolName] = {
            enabled: true,
            usageCount: 0,
          };
        }
        newConfig[serverName][actualToolName].enabled = !allEnabled;
      });

      return newConfig;
    });
  };

  const isServerEnabled = (serverName: string) => {
    const serverTools = allKnownMcpTools.filter(tool => tool.server === serverName);
    return (
      serverTools.length > 0 &&
      serverTools.every(tool => isMcpToolEnabled(tool.name))
    );
  };

  const isServerPartiallyEnabled = (serverName: string) => {
    const serverTools = allKnownMcpTools.filter(tool => tool.server === serverName);
    const enabledCount = serverTools.filter(tool => isMcpToolEnabled(tool.name)).length;
    return enabledCount > 0 && enabledCount < serverTools.length;
  };

  // Filter tools based on search query - use allKnownMcpTools to show all tools (including disabled ones)
  const filteredMcpTools = allKnownMcpTools.filter(
    tool =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tool.description && tool.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group tools by server
  const groupedToolsByServer = filteredMcpTools.reduce((acc, tool) => {
    const serverName = tool.server || 'Unknown Server';
    if (!acc[serverName]) {
      acc[serverName] = [];
    }
    acc[serverName].push(tool);
    return acc;
  }, {} as { [key: string]: MCPTool[] });

  const handleToggleServerExpansion = (serverName: string) => {
    const newExpanded = new Set(expandedServers);
    if (newExpanded.has(serverName)) {
      newExpanded.delete(serverName);
    } else {
      newExpanded.add(serverName);
    }
    setExpandedServers(newExpanded);
  };

  const handleSave = async () => {
    try {
      // Save regular tools configuration
      onToolsChange(localEnabledTools);

      // Save MCP tools configuration if it has changed
      const mcpConfigChanged = JSON.stringify(mcpToolsConfig) !== JSON.stringify(originalMcpConfig);
      
      if (mcpConfigChanged) {
        const mcpClient = new ElectronMCPClient();
        console.log('Saving MCP tools configuration:', mcpToolsConfig);
        if (mcpClient.isAvailable()) {
          const response = await mcpClient.updateToolsConfig(mcpToolsConfig);
          if (!response) {
            console.error('Failed to save MCP tools configuration');
            // Still continue to close dialog, but log the error
          } else {
            console.log('MCP tools configuration saved successfully');
          }
        }
      }

      onClose();
    } catch (error) {
      console.error('Error saving configuration:', error);
      // Still close the dialog even if there was an error
      onClose();
    }
  };

  const handleCancel = () => {
    // Restore original state for both regular and MCP tools
    setLocalEnabledTools(enabledTools);
    setMcpToolsConfig(JSON.parse(JSON.stringify(originalMcpConfig)));
    onClose();
  };

  const getToolIcon = (toolName: string, toolType?: string) => {
    if (toolType === 'mcp' || toolName.includes('mcp')) {
      return 'mdi:connection';
    }
    if (toolName.includes('kubernetes') || toolName.includes('k8s')) {
      return 'mdi:kubernetes';
    }
    return 'mdi:tool';
  };

  const renderMcpToolList = () => (
    <>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 0.5 }}>
          MCP Tools
        </Typography>
        <Typography variant="body2" color="text.secondary">
          These are Model Context Protocol tools that provide additional capabilities to the
          assistant.
        </Typography>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search MCP tools..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          size="small"
          sx={{ mt: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon icon="mdi:magnify" style={{ fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {isLoadingMcp ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Loading MCP tools...
          </Typography>
        </Box>
      ) : (
        <>
          {Object.entries(groupedToolsByServer).map(([serverName, tools]) => (
            <Accordion
              key={serverName}
              expanded={expandedServers.has(serverName)}
              onChange={() => handleToggleServerExpansion(serverName)}
              sx={{ mb: 1 }}
            >
              <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                    <Icon icon="mdi:server" style={{ fontSize: 20 }} />
                    <Typography variant="subtitle1">
                      {serverName} ({tools.length} tools)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Switch
                      size="small"
                      checked={isServerEnabled(serverName)}
                      onChange={e => {
                        e.stopPropagation();
                        handleToggleServer(serverName);
                      }}
                      onClick={e => e.stopPropagation()}
                      sx={{
                        ...(isServerPartiallyEnabled(serverName) && {
                          '& .MuiSwitch-thumb': {
                            backgroundColor: 'orange',
                          },
                          '& .MuiSwitch-track': {
                            backgroundColor: 'rgba(255, 165, 0, 0.3)',
                          },
                        }),
                      }}
                    />
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <List sx={{ pl: 2 }}>
                  {tools.map((tool, index) => (
                    <React.Fragment key={`${serverName}-${tool.name}-${index}`}>
                      <ListItem>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            minWidth: 40,
                            justifyContent: 'center',
                            mr: 1,
                          }}
                        >
                          <Icon
                            icon={getToolIcon(tool.name, 'mcp')}
                            style={{ fontSize: 18, marginRight: 8 }}
                          />
                        </Box>

                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1">{tool.name}</Typography>
                              <Chip label="MCP" size="small" color="info" variant="outlined" />
                            </Box>
                          }
                          secondary={tool.description}
                        />

                        <ListItemSecondaryAction>
                          <Switch
                            size="small"
                            edge="end"
                            onChange={() => handleToggleMcpTool(tool.name)}
                            checked={isMcpToolEnabled(tool.name)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < tools.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}

          {filteredMcpTools.length === 0 && allKnownMcpTools.length > 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: 'italic', textAlign: 'center', py: 3 }}
            >
              No tools match your search query.
            </Typography>
          )}

          {allKnownMcpTools.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: 'italic', textAlign: 'center', py: 3 }}
            >
              No MCP tools available. Connect to MCP servers to see available tools.
            </Typography>
          )}
        </>
      )}
    </>
  ); // Get tool categories
  const kubernetesTools = AVAILABLE_TOOLS.filter(ToolClass => {
    const tempTool = new ToolClass();
    return tempTool.config.name.includes('kubernetes') || tempTool.config.name.includes('k8s');
  });

  const otherTools = AVAILABLE_TOOLS.filter(ToolClass => {
    const tempTool = new ToolClass();
    return !tempTool.config.name.includes('kubernetes') && !tempTool.config.name.includes('k8s');
  });

  const renderToolList = (tools: any[], title: string, subtitle?: string) => (
    <>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 0.5 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>

      <List>
        {tools.map(ToolClass => {
          const tempTool = new ToolClass();
          const toolName = tempTool.config.name;
          const isEnabled = localEnabledTools.includes(toolName);

          return (
            <ListItem key={toolName} divider>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                <Icon icon={getToolIcon(toolName)} style={{ fontSize: 20, marginRight: 8 }} />
              </Box>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">
                      {tempTool.config.displayName || toolName}
                    </Typography>
                    {tempTool.config.category && (
                      <Chip label={tempTool.config.category} size="small" variant="outlined" />
                    )}
                  </Box>
                }
                secondary={tempTool.config.shortDescription || tempTool.config.description}
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  onChange={() => handleToggleRegularTool(toolName)}
                  checked={isEnabled}
                  color="primary"
                />
              </ListItemSecondaryAction>
            </ListItem>
          );
        })}
      </List>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon icon="mdi:tools" style={{ fontSize: 24 }} />
          <Typography variant="h6">Manage Tools</Typography>
          <Chip label={`${localEnabledTools.length} enabled`} size="small" color="primary" />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enable or disable tools that the AI can use. Changes will take effect immediately and will
          be saved to your settings.
        </Typography>

        {/* Kubernetes Tools */}
        {kubernetesTools.length > 0 && (
          <>
            {renderToolList(
              kubernetesTools,
              'Kubernetes Tools',
              'Tools for interacting with Kubernetes clusters'
            )}
            <Divider sx={{ my: 3 }} />
          </>
        )}

        {/* Other Tools */}
        {otherTools.length > 0 &&
          renderToolList(
            otherTools,
            'System Tools',
            'General purpose tools for various operations'
          )}

        {/* MCP Tools */}
        {renderMcpToolList()}

        {(kubernetesTools.length > 0 || otherTools.length > 0) && <Divider sx={{ my: 3 }} />}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ToolsDialog;
