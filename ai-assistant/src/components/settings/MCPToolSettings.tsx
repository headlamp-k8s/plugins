import { Icon } from '@iconify/react';
import { Headlamp } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import {
  Box,
  Button,
  Chip,
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
  Typography,
  useTheme,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { parseMCPToolName } from '../../utils/ToolConfigManager';

interface MCPToolState {
  enabled: boolean;
  lastUsed?: Date;
  usageCount?: number;
}

interface MCPServerToolState {
  [toolName: string]: MCPToolState;
}

interface MCPToolsConfig {
  [serverName: string]: MCPServerToolState;
}

interface MCPToolInfo {
  name: string;
  description?: string;
  server: string;
  actualToolName: string;
  enabled: boolean;
  stats: MCPToolState | null;
}

interface MCPToolSettingsProps {
  onConfigChange?: (hasChanges: boolean) => void;
}

export function MCPToolSettings({ onConfigChange }: MCPToolSettingsProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [mcpTools, setMCPTools] = useState<MCPToolInfo[]>([]);
  const [toolsConfig, setToolsConfig] = useState<MCPToolsConfig>({});
  const [originalConfig, setOriginalConfig] = useState<MCPToolsConfig>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load MCP tools and configuration
  const loadMCPToolsAndConfig = useCallback(async () => {
    if (!Headlamp.isRunningAsApp() || !window.desktopApi?.mcp) {
      setError('MCP tool management is only available in the Headlamp desktop application.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get available MCP tools
      const toolsResponse = await window.desktopApi.mcp.getTools();
      if (!toolsResponse.success) {
        throw new Error(toolsResponse.error || 'Failed to get MCP tools');
      }

      // Get tools configuration
      const configResponse = await window.desktopApi.mcp.getToolsConfig();
      if (!configResponse.success) {
        throw new Error(configResponse.error || 'Failed to get MCP tools configuration');
      }

      const config = configResponse.config || {};
      setToolsConfig(config);
      setOriginalConfig(JSON.parse(JSON.stringify(config))); // Deep copy for comparison

      // Process tools data
      const toolsData: MCPToolInfo[] = [];
      
      for (const tool of toolsResponse.tools || []) {
        const { serverName, toolName: actualToolName } = parseMCPToolName(tool.name);
        
        // Get tool state from configuration
        const serverConfig = config[serverName];
        const toolState = serverConfig?.[actualToolName];
        const enabled = toolState?.enabled !== false; // Default to true if not configured
        
        // Get tool statistics
        let stats: MCPToolState | null = null;
        try {
          const statsResponse = await window.desktopApi.mcp.getToolStats(serverName, actualToolName);
          if (statsResponse.success) {
            stats = statsResponse.stats;
          }
        } catch (error) {
          console.warn(`Failed to get stats for tool ${tool.name}:`, error);
        }

        toolsData.push({
          name: tool.name,
          description: tool.description,
          server: serverName,
          actualToolName,
          enabled,
          stats,
        });
      }

      // Sort tools by server name and tool name
      toolsData.sort((a, b) => {
        if (a.server !== b.server) {
          return a.server.localeCompare(b.server);
        }
        return a.actualToolName.localeCompare(b.actualToolName);
      });

      setMCPTools(toolsData);
    } catch (error) {
      console.error('Error loading MCP tools and configuration:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMCPToolsAndConfig();
  }, [loadMCPToolsAndConfig]);

  // Handle tool enable/disable toggle (local state only)
  const handleToolToggle = (toolInfo: MCPToolInfo, enabled: boolean) => {
    // Update local tool state
    setMCPTools(prevTools =>
      prevTools.map(tool =>
        tool.name === toolInfo.name ? { ...tool, enabled } : tool
      )
    );

    // Update configuration state
    setToolsConfig(prevConfig => {
      console.log('Previous config:', prevConfig);
      const newConfig = { ...prevConfig };
      if (!newConfig[toolInfo.server]) {
        newConfig[toolInfo.server] = {};
      }
      if (!newConfig[toolInfo.server][toolInfo.actualToolName]) {
        newConfig[toolInfo.server][toolInfo.actualToolName] = {
          enabled: true,
          usageCount: 0,
        };
      }
      newConfig[toolInfo.server][toolInfo.actualToolName].enabled = enabled;
      return newConfig;
    });

    // Mark as having changes
    setHasChanges(true);
    onConfigChange?.(true);
  };

  // Refresh tools and configuration
  const handleRefresh = () => {
    setHasChanges(false);
    onConfigChange?.(false);
    loadMCPToolsAndConfig();
  };

  // Save configuration changes
  const handleSaveChanges = async () => {
    console.log('Saving changes:', toolsConfig);
    if (!window.desktopApi?.mcp) {
      return;
    }

    try {
      console.log("Saving MCP tools configuration:", toolsConfig);
      const response = await window.desktopApi.mcp.updateToolsConfig(toolsConfig);
      if (response.success) {
        setHasChanges(false);
        onConfigChange?.(false);
        setOriginalConfig(JSON.parse(JSON.stringify(toolsConfig))); // Update original config
        console.log('MCP tools configuration saved successfully');
      } else {
        throw new Error(response.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving MCP tools configuration:', error);
      setError(`Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Discard changes and revert to original configuration
  const handleDiscardChanges = () => {
    setToolsConfig(JSON.parse(JSON.stringify(originalConfig))); // Restore original config
    
    // Update tools to reflect original configuration
    setMCPTools(prevTools =>
      prevTools.map(tool => {
        const serverConfig = originalConfig[tool.server];
        const toolState = serverConfig?.[tool.actualToolName];
        const enabled = toolState?.enabled !== false; // Default to true if not configured
        return { ...tool, enabled };
      })
    );
    
    setHasChanges(false);
    onConfigChange?.(false);
  };

  // Enable all tools (local state only)
  const handleEnableAll = () => {
    // Update all tools to enabled in local state
    setMCPTools(prevTools =>
      prevTools.map(tool => ({ ...tool, enabled: true }))
    );

    // Update configuration state
    setToolsConfig(prevConfig => {
      const newConfig = { ...prevConfig };
      for (const tool of mcpTools) {
        if (!newConfig[tool.server]) {
          newConfig[tool.server] = {};
        }
        if (!newConfig[tool.server][tool.actualToolName]) {
          newConfig[tool.server][tool.actualToolName] = {
            enabled: true,
            usageCount: 0,
          };
        }
        newConfig[tool.server][tool.actualToolName].enabled = true;
      }
      return newConfig;
    });

    setHasChanges(true);
    onConfigChange?.(true);
  };

  // Disable all tools (local state only)
  const handleDisableAll = () => {
    // Update all tools to disabled in local state
    setMCPTools(prevTools =>
      prevTools.map(tool => ({ ...tool, enabled: false }))
    );

    // Update configuration state
    setToolsConfig(prevConfig => {
      const newConfig = { ...prevConfig };
      for (const tool of mcpTools) {
        if (!newConfig[tool.server]) {
          newConfig[tool.server] = {};
        }
        if (!newConfig[tool.server][tool.actualToolName]) {
          newConfig[tool.server][tool.actualToolName] = {
            enabled: true,
            usageCount: 0,
          };
        }
        newConfig[tool.server][tool.actualToolName].enabled = false;
      }
      return newConfig;
    });

    setHasChanges(true);
    onConfigChange?.(true);
  };

  // Format usage count for display
  const formatUsageCount = (count?: number): string => {
    if (count === undefined || count === 0) return 'Never used';
    return `Used ${count} time${count === 1 ? '' : 's'}`;
  };

  // Format last used date for display
  const formatLastUsed = (lastUsed?: Date): string => {
    if (!lastUsed) return 'Never';
    const date = new Date(lastUsed);
    return date.toLocaleString();
  };

  // Group tools by server
  const groupedTools = mcpTools.reduce((groups, tool) => {
    if (!groups[tool.server]) {
      groups[tool.server] = [];
    }
    groups[tool.server].push(tool);
    return groups;
  }, {} as Record<string, MCPToolInfo[]>);

  const enabledCount = mcpTools.filter(tool => tool.enabled).length;
  const totalCount = mcpTools.length;

  if (loading) {
    return (
      <SectionBox title="MCP Tool Configuration">
        <Box display="flex" justifyContent="center" py={4}>
          <Typography>Loading MCP tools...</Typography>
        </Box>
      </SectionBox>
    );
  }

  if (error) {
    return (
      <SectionBox title="MCP Tool Configuration">
        <Box display="flex" flexDirection="column" alignItems="center" py={4}>
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
          <Button onClick={handleRefresh} startIcon={<Icon icon="mdi:refresh" />}>
            Retry
          </Button>
        </Box>
      </SectionBox>
    );
  }

  return (
    <SectionBox title="MCP Tool Configuration">
      <Box mb={2}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Configure individual MCP (Model Context Protocol) tools. You can enable or disable specific tools 
          to control which capabilities are available to the AI assistant.
        </Typography>
        
        <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={`${enabledCount}/${totalCount} tools enabled`}
              color={enabledCount === totalCount ? 'success' : 'default'}
              size="small"
            />
            {hasChanges && (
              <Chip
                label="Unsaved changes"
                color="warning"
                size="small"
                icon={<Icon icon="mdi:pencil" />}
              />
            )}

          </Box>
          
          <Box display="flex" gap={1}>
            {hasChanges && (
              <>
                <Button
                  onClick={handleSaveChanges}
                  startIcon={<Icon icon="mdi:content-save" />}
                  size="small"
                  variant="contained"
                  color="primary"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={handleDiscardChanges}
                  startIcon={<Icon icon="mdi:cancel" />}
                  size="small"
                  variant="outlined"
                  color="secondary"
                >
                  Discard Changes
                </Button>
              </>
            )}
            <Button
              onClick={handleEnableAll}
              startIcon={<Icon icon="mdi:check-all" />}
              size="small"
              disabled={enabledCount === totalCount}
            >
              Enable All
            </Button>
            <Button
              onClick={handleDisableAll}
              startIcon={<Icon icon="mdi:cancel" />}
              size="small"
              disabled={enabledCount === 0}
              color="secondary"
            >
              Disable All
            </Button>
            <IconButton onClick={handleRefresh} size="small">
              <Icon icon="mdi:refresh" />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {totalCount === 0 ? (
        <Box display="flex" flexDirection="column" alignItems="center" py={4}>
          <Icon icon="mdi:tools" style={{ fontSize: 48, color: theme.palette.text.secondary, marginBottom: 16 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No MCP Tools Available
          </Typography>
          <Typography variant="body2" color="textSecondary" align="center">
            No MCP servers are configured or running. Configure MCP servers in the MCP Settings section 
            to see available tools here.
          </Typography>
        </Box>
      ) : (
        Object.entries(groupedTools).map(([serverName, serverTools]) => (
          <Box key={serverName} mb={3}>
            <Typography variant="h6" gutterBottom>
              <Icon icon="mdi:server" style={{ marginRight: 8, verticalAlign: 'middle' }} />
              {serverName} ({serverTools.length} tools)
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tool Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Usage Statistics</TableCell>
                    <TableCell align="center">Enabled</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {serverTools.map((tool) => (
                    <TableRow key={tool.name}>
                      <TableCell>
                        <Typography variant="body2" component="div">
                          <strong>{tool.actualToolName}</strong>
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {tool.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {tool.description || 'No description available'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {formatUsageCount(tool.stats?.usageCount)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Last used: {formatLastUsed(tool.stats?.lastUsed)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <FormControlLabel
                          control={
                            <Switch
                              checked={tool.enabled}
                              onChange={(e) => handleToolToggle(tool, e.target.checked)}
                              size="small"
                            />
                          }
                          label=""
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))
      )}
    </SectionBox>
  );
}