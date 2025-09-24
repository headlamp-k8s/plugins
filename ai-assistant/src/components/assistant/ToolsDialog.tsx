import { Icon } from '@iconify/react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Switch,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import tools from '../../ai/mcp/electron-client';
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
  const [loadingMcpTools, setLoadingMcpTools] = useState<boolean>(false);

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
    setLoadingMcpTools(true);
    try {
      const mcpToolsData = await tools();
      setMcpTools(mcpToolsData || []);
    } catch (error) {
      console.warn('Failed to load MCP tools:', error);
      setMcpTools([]);
    } finally {
      setLoadingMcpTools(false);
    }
  };

  const handleToggleTool = (toolName: string) => {
    setLocalEnabledTools(prev =>
      prev.includes(toolName) ? prev.filter(name => name !== toolName) : [...prev, toolName]
    );
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
          External Model Context Protocol tools (always enabled)
        </Typography>
      </Box>

      {loadingMcpTools ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Loading MCP tools...
          </Typography>
        </Box>
      ) : (
        <List>
          {mcpTools.length > 0 ? (
            mcpTools.map((tool, index) => (
              <ListItem key={`mcp-${index}`}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    minWidth: 40,
                    justifyContent: 'center',
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
                  secondary={tool.description || 'External MCP tool'}
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    onChange={() => handleToggleTool(tool.name)}
                    checked={localEnabledTools.includes(tool.name)}
                    color="primary"
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText
                primary={
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No MCP tools available. Configure MCP servers to see tools here.
                  </Typography>
                }
              />
            </ListItem>
          )}
        </List>
      )}
    </>
  );

  // Get tool categories
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
