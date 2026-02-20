import { Icon } from '@iconify/react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface ToolCall {
  id: string;
  name: string;
  description?: string;
  arguments: Record<string, any>;
  type: 'mcp' | 'regular';
}

interface ToolApprovalDialogProps {
  open: boolean;
  toolCalls: ToolCall[];
  onApprove: (approvedToolIds: string[]) => void;
  onDeny: () => void;
  onClose: () => void;
  loading?: boolean;
}

const ToolApprovalDialog: React.FC<ToolApprovalDialogProps> = ({
  open,
  toolCalls,
  onApprove,
  onDeny,
  onClose,
  loading = false,
}) => {
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(toolCalls.map(tool => tool.id));
  const [rememberChoice, setRememberChoice] = useState(false);

  // Reset selection when toolCalls change
  React.useEffect(() => {
    if (open) {
      setSelectedToolIds(toolCalls.map(tool => tool.id));
      setRememberChoice(false);
    }
  }, [toolCalls, open]);

  const handleSelectAll = () => {
    setSelectedToolIds(toolCalls.map(tool => tool.id));
  };

  const handleDeselectAll = () => {
    setSelectedToolIds([]);
  };

  const handleToolToggle = (toolId: string) => {
    setSelectedToolIds(prev =>
      prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
    );
  };

  const handleApprove = () => {
    onApprove(selectedToolIds);
  };

  const mcpTools = toolCalls.filter(tool => tool.type === 'mcp');
  const regularTools = toolCalls.filter(tool => tool.type === 'regular');

  const getToolIcon = (toolName: string, toolType: 'mcp' | 'regular') => {
    if (toolType === 'mcp') {
      return 'mdi:docker'; // Inspektor Gadget runs in Docker
    }

    // Regular Kubernetes tools
    if (toolName.includes('kubernetes') || toolName.includes('k8s')) {
      return 'mdi:kubernetes';
    }
    return 'mdi:tool';
  };

  const formatArguments = (args: Record<string, any>) => {
    return Object.entries(args)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => (
        <ListItem key={key} dense>
          <ListItemText
            primary={key}
            secondary={typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
          />
        </ListItem>
      ));
  };

  const renderToolSection = (tools: ToolCall[], title: string, color: 'primary' | 'secondary') => {
    if (tools.length === 0) return null;

    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          {title}
          <Chip label={tools.length} size="small" color={color} sx={{ ml: 1 }} />
        </Typography>
        {tools.map(tool => (
          <Accordion key={tool.id} sx={{ mb: 1 }}>
            <AccordionSummary
              expandIcon={<Icon icon="mdi:chevron-down" />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  alignItems: 'center',
                },
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedToolIds.includes(tool.id)}
                    onChange={() => handleToolToggle(tool.id)}
                    onClick={e => e.stopPropagation()}
                  />
                }
                label=""
                sx={{ mr: 1 }}
                onClick={e => e.stopPropagation()}
              />
              <Icon icon={getToolIcon(tool.name, tool.type)} style={{ marginRight: 8 }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {tool.name}
                </Typography>
                {tool.description && (
                  <Typography variant="caption" color="text.secondary">
                    {tool.description}
                  </Typography>
                )}
              </Box>
              {tool.type === 'mcp' && (
                <Chip
                  label="MCP Tool"
                  size="small"
                  color="info"
                  variant="outlined"
                  sx={{ ml: 'auto', mr: 1 }}
                />
              )}
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" gutterBottom color="text.secondary">
                Arguments to be passed:
              </Typography>
              <List dense>{formatArguments(tool.arguments)}</List>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '50vh' },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Icon icon="mdi:security" style={{ marginRight: 8 }} />
          Tool Execution Approval Required
        </Box>
        {!loading && (
          <IconButton onClick={onClose} size="small">
            <Icon icon="mdi:close" />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          The AI Assistant wants to execute {toolCalls.length} tool{toolCalls.length > 1 ? 's' : ''}
          to complete your request. Please review and approve the tools you want to allow.
        </Alert>

        {mcpTools.length > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              MCP Tools (Inspektor Gadget)
            </Typography>
            <Typography variant="body2">
              These tools will execute debugging commands in your Kubernetes clusters through
              Inspektor Gadget containers. They provide deep system-level insights but require
              elevated permissions.
            </Typography>
          </Alert>
        )}

        <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleSelectAll}
            startIcon={<Icon icon="mdi:check-all" />}
          >
            Select All
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleDeselectAll}
            startIcon={<Icon icon="mdi:close-box-multiple" />}
          >
            Deselect All
          </Button>
        </Box>

        {renderToolSection(regularTools, 'Kubernetes Tools', 'primary')}
        {renderToolSection(mcpTools, 'MCP Tools (Inspektor Gadget)', 'secondary')}

        <FormGroup sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberChoice}
                onChange={e => setRememberChoice(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2">
                Remember my choice for this session (auto-approve similar tools)
              </Typography>
            }
          />
        </FormGroup>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {selectedToolIds.length} of {toolCalls.length} tools selected
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onDeny} disabled={loading} color="error">
              Deny All
            </Button>
            <Button
              onClick={handleApprove}
              variant="contained"
              disabled={loading || selectedToolIds.length === 0}
              startIcon={
                loading ? (
                  <Icon icon="mdi:loading" className="animate-spin" />
                ) : (
                  <Icon icon="mdi:check" />
                )
              }
            >
              {loading
                ? 'Executing...'
                : `Approve ${selectedToolIds.length > 0 ? `(${selectedToolIds.length})` : ''}`}
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ToolApprovalDialog;
