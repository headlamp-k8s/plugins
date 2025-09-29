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
  const [mcpTools, setMcpTools] = useState<MCPTool[]>([]);
  const [isLoadingMcp, setIsLoadingMcp] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set(['MCP Tools']));

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

  const loadMcpTools = async () => {
    console.log('ToolsDialog: Starting to load MCP tools...');
    setIsLoadingMcp(true);
    try {
      const mcpClient = new ElectronMCPClient();
      console.log('ToolsDialog: Created MCP client, isAvailable:', mcpClient.isAvailable());
      const tools = await mcpClient.getTools();
      console.log('ToolsDialog: Received tools from client:', tools.length, 'tools');
      console.log('ToolsDialog: Tools:', tools);
      setMcpTools(tools);
    } catch (error) {
      console.error('ToolsDialog: Failed to load MCP tools:', error);
      setMcpTools([]);
    } finally {
      setIsLoadingMcp(false);
    }
  };

  const handleToggleTool = (toolName: string) => {
    const newEnabledTools = localEnabledTools.includes(toolName)
      ? localEnabledTools.filter(name => name !== toolName)
      : [...localEnabledTools, toolName];
    setLocalEnabledTools(newEnabledTools);
  };

  // Filter tools based on search query
  const filteredMcpTools = mcpTools.filter(
    tool =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tool.description && tool.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group tools by server (simplified version for now)
  const groupedTools = { 'MCP Tools': filteredMcpTools };

  const handleToggleServer = (serverName: string) => {
    const newExpanded = new Set(expandedServers);
    if (newExpanded.has(serverName)) {
      newExpanded.delete(serverName);
    } else {
      newExpanded.add(serverName);
    }
    setExpandedServers(newExpanded);
  };

  const handleSave = () => {
    onToolsChange(localEnabledTools);
    onClose();
  };

  const handleCancel = () => {
    setLocalEnabledTools(enabledTools);
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
          {Object.entries(groupedTools).map(([serverName, tools]) => (
            <Accordion
              key={serverName}
              expanded={expandedServers.has(serverName)}
              onChange={() => handleToggleServer(serverName)}
              sx={{ mb: 1 }}
            >
              <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" />}>
                <Typography variant="subtitle1">
                  {serverName} ({tools.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <List>
                  {tools.map((tool, index) => (
                    <>
                      <ListItem key={`${serverName}-${index}`}>
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
                            style={{ fontSize: 20, marginRight: 8 }}
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
                            edge="end"
                            onChange={() => handleToggleTool(tool.name)}
                            checked={localEnabledTools.includes(tool.name)}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < tools.length - 1 && <Divider component="li" />}
                    </>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}

          {filteredMcpTools.length === 0 && mcpTools.length > 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: 'italic', textAlign: 'center', py: 3 }}
            >
              No tools match your search query.
            </Typography>
          )}

          {mcpTools.length === 0 && (
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
                secondary={tempTool.config.description}
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  onChange={() => handleToggleTool(toolName)}
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
