import type { ToolCall } from '@headlamp-k8s/ai-common/tools/types';
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
  FormControlLabel,
  FormGroup,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Props for {@link ToolApprovalDialog}. */
export interface ToolApprovalDialogProps {
  /** Whether the dialog is currently open. */
  open: boolean;
  /** Tool calls that the user can review. */
  toolCalls: ToolCall[];
  /** Approves the selected tool ids. */
  onApprove: (approvedToolIds: string[], rememberChoice?: boolean) => void;
  /** Rejects all pending tool calls. */
  onDeny: () => void;
  /** Closes the dialog without approval. */
  onClose: () => void;
  /** Whether tool execution is currently in progress. */
  loading?: boolean;
}

/**
 * Presents a modal review flow for approving or denying pending tool executions.
 *
 * @param props - Dialog state, pending calls, callbacks, and loading state.
 * @returns Tool approval dialog.
 */
const ToolApprovalDialog: React.FC<ToolApprovalDialogProps> = ({
  open,
  toolCalls,
  onApprove,
  onDeny,
  onClose,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(toolCalls.map(tool => tool.id));
  const [rememberChoice, setRememberChoice] = useState(false);
  const titleId = React.useId();

  // Reset selection when toolCalls change
  React.useEffect(() => {
    if (open) {
      setSelectedToolIds(toolCalls.map(tool => tool.id));
      setRememberChoice(false);
    }
  }, [toolCalls, open]);

  const handleSelectAll = (): void => {
    setSelectedToolIds(toolCalls.map(tool => tool.id));
  };

  const handleDeselectAll = (): void => {
    setSelectedToolIds([]);
  };

  const handleToolToggle = (toolId: string): void => {
    setSelectedToolIds(prev =>
      prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
    );
  };

  const handleApprove = (): void => {
    onApprove(selectedToolIds, rememberChoice);
  };

  const mcpTools = toolCalls.filter(tool => tool.type === 'mcp');
  const regularTools = toolCalls.filter(tool => tool.type === 'regular');

  const getToolIcon = (toolName: string, toolType: 'mcp' | 'regular'): string => {
    if (toolType === 'mcp') {
      return 'mdi:docker'; // Inspektor Gadget runs in Docker
    }

    // Regular Kubernetes tools
    if (toolName.includes('kubernetes') || toolName.includes('k8s')) {
      return 'mdi:kubernetes';
    }
    return 'mdi:tool';
  };

  /** @returns A readable representation of one untrusted tool argument. */
  const formatArgumentValue = (value: unknown): string => {
    if (typeof value !== 'object' || value === null) return String(value);
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  /** @returns Visible non-empty argument rows. */
  const formatArguments = (args: Record<string, unknown>): React.ReactNode[] => {
    return Object.entries(args)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => (
        <ListItem key={key} dense>
          <ListItemText primary={key} secondary={formatArgumentValue(value)} />
        </ListItem>
      ));
  };

  const renderToolSection = (
    tools: ToolCall[],
    title: string,
    color: 'primary' | 'secondary'
  ): React.ReactElement | null => {
    if (tools.length === 0) return null;

    return (
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h6"
          component="h3"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          {title}
          <Chip label={tools.length} size="small" color={color} sx={{ ml: 1 }} />
        </Typography>
        {tools.map(tool => (
          <Box key={tool.id} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
            <Checkbox
              checked={selectedToolIds.includes(tool.id)}
              onChange={() => handleToolToggle(tool.id)}
              inputProps={{ 'aria-label': t('Approve tool {{name}}', { name: tool.name }) }}
              sx={{ mt: 0.5 }}
            />
            <Accordion sx={{ flex: 1 }}>
              <AccordionSummary
                expandIcon={<Icon icon="mdi:chevron-down" aria-hidden="true" />}
                sx={{
                  '& .MuiAccordionSummary-content': {
                    alignItems: 'center',
                  },
                }}
              >
                <Icon
                  icon={getToolIcon(tool.name, tool.type)}
                  style={{ marginRight: 8 }}
                  aria-hidden="true"
                />
                <Box>
                  <Typography variant="subtitle1" component="span" sx={{ fontWeight: 'bold' }}>
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
                    label={t('MCP Tool')}
                    size="small"
                    color="info"
                    variant="outlined"
                    sx={{ ml: 'auto', mr: 1 }}
                  />
                )}
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" gutterBottom color="text.secondary">
                  {t('Arguments to be passed:')}
                </Typography>
                <List dense>{formatArguments(tool.arguments)}</List>
              </AccordionDetails>
            </Accordion>
          </Box>
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
      aria-labelledby={titleId}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
        }}
      >
        <Typography
          id={titleId}
          variant="h6"
          component="h2"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Icon icon="mdi:security" style={{ marginRight: 8 }} aria-hidden="true" />
          {t('Tool Execution Approval Required')}
        </Typography>
        {!loading && (
          <IconButton aria-label={t('Close dialog')} onClick={onClose} size="small">
            <Icon icon="mdi:close" aria-hidden="true" />
          </IconButton>
        )}
      </Box>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          {t(
            toolCalls.length === 1
              ? 'The AI Assistant wants to execute 1 tool to complete your request. Please review and approve the tool you want to allow.'
              : 'The AI Assistant wants to execute {{count}} tools to complete your request. Please review and approve the tools you want to allow.',
            { count: toolCalls.length }
          )}
        </Alert>

        {mcpTools.length > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" component="p" gutterBottom>
              {t('MCP Tools (Inspektor Gadget)')}
            </Typography>
            <Typography variant="body2">
              {t(
                'These tools will execute debugging commands in your Kubernetes clusters through Inspektor Gadget containers. They provide deep system-level insights but require elevated permissions.'
              )}
            </Typography>
          </Alert>
        )}

        <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleSelectAll}
            startIcon={<Icon icon="mdi:check-all" aria-hidden="true" />}
          >
            {t('Select All')}
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleDeselectAll}
            startIcon={<Icon icon="mdi:close-box-multiple" aria-hidden="true" />}
          >
            {t('Deselect All')}
          </Button>
        </Box>

        {renderToolSection(regularTools, t('Kubernetes Tools'), 'primary')}
        {renderToolSection(mcpTools, t('MCP Tools (Inspektor Gadget)'), 'secondary')}

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
                {t('Remember my choice for this session (auto-approve similar tools)')}
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
            {t('{{selected}} of {{total}} tools selected', {
              selected: selectedToolIds.length,
              total: toolCalls.length,
            })}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onDeny} disabled={loading} color="error">
              {t('Deny All')}
            </Button>
            <Button
              onClick={handleApprove}
              variant="contained"
              disabled={loading || selectedToolIds.length === 0}
              startIcon={
                loading ? (
                  <Icon icon="mdi:loading" className="animate-spin" aria-hidden="true" />
                ) : (
                  <Icon icon="mdi:check" aria-hidden="true" />
                )
              }
            >
              {loading
                ? t('Executing...')
                : t('Approve selected tools ({{count}})', { count: selectedToolIds.length })}
            </Button>
          </Box>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ToolApprovalDialog;
