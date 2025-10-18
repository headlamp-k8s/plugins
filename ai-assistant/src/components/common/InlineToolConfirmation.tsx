import { Icon } from '@iconify/react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputLabel,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
  MCPArgumentProcessor,
  type ProcessedArguments,
  type UserContext,
} from '../mcpOutput/MCPArgumentProcessor';

interface ToolCall {
  id: string;
  name: string;
  description?: string;
  arguments: Record<string, any>;
  type: 'mcp' | 'regular';
}

interface InlineToolConfirmationProps {
  toolCalls: ToolCall[];
  onApprove: (approvedToolIds: string[]) => void;
  onDeny: () => void;
  loading?: boolean;
  compact?: boolean;
  userContext?: UserContext;
}

const InlineToolConfirmation: React.FC<InlineToolConfirmationProps> = ({
  toolCalls,
  onApprove,
  onDeny,
  loading = false,
  userContext,
}) => {
  const theme = useTheme();
  const [selectedToolIds] = useState<string[]>(toolCalls.map(tool => tool.id));
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set()); // Track which tools are expanded

  // State to track processed arguments for each tool
  const [processedArguments, setProcessedArguments] = useState<Record<string, ProcessedArguments>>(
    {}
  );
  const [editedArguments, setEditedArguments] = useState<Record<string, Record<string, any>>>({});
  const [argumentsInitialized, setArgumentsInitialized] = useState(false);

  // State to track deny action
  const [isDenying, setIsDenying] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Initialize arguments with intelligent processing
  useEffect(() => {
    const initializeArguments = async () => {
      const processed: Record<string, ProcessedArguments> = {};
      const edited: Record<string, Record<string, any>> = {};

      for (const tool of toolCalls) {
        if (tool.type === 'mcp') {
          // Process MCP tool arguments with intelligent defaults
          const processedArgs = await MCPArgumentProcessor.processArguments(
            tool.name,
            tool.arguments,
            userContext
          );
          processed[tool.id] = processedArgs;
          edited[tool.id] = { ...processedArgs.processed };
        } else {
          // For regular tools, use arguments as-is
          edited[tool.id] = { ...tool.arguments };
        }
      }

      setProcessedArguments(processed);
      setEditedArguments(edited);
      setArgumentsInitialized(true);
    };

    if (!argumentsInitialized) {
      initializeArguments();
    }
  }, [toolCalls, argumentsInitialized]);

  const handleApprove = async () => {
    if (isApproving || isDenying) return; // Prevent double-clicks

    if (selectedToolIds.length === 0) {
      handleDeny();
      return;
    }

    setIsApproving(true);

    try {
      // Update the original toolCalls with edited arguments
      toolCalls.forEach(tool => {
        if (editedArguments[tool.id]) {
          const edited = editedArguments[tool.id];

          if (tool.type === 'mcp') {
            // For MCP tools, clean up arguments before sending
            const processedArgs = processedArguments[tool.id];
            if (processedArgs?.schema) {
              // Use the argument processor to clean up the final arguments
              const cleaned = MCPArgumentProcessor.cleanupArguments(edited, processedArgs.schema);
              tool.arguments = cleaned;
            } else {
              tool.arguments = edited;
            }
          } else {
            // For regular tools, use edited arguments as-is
            tool.arguments = edited;
          }
        }
      });

      onApprove(selectedToolIds);
    } catch (error) {
      console.error('Error during tool approval:', error);
      setIsApproving(false);
    }
  };

  const handleDeny = async () => {
    if (isDenying || isApproving) return; // Prevent double-clicks and conflicts

    setIsDenying(true);

    try {
      onDeny();
    } catch (error) {
      console.error('Error during tool denial:', error);
      setIsDenying(false);
    }
  };

  const getToolIcon = (toolName: string, toolType: 'mcp' | 'regular') => {
    if (toolType === 'mcp') {
      return 'mdi:connection'; // Use connection icon for MCP tools
    }

    if (toolName.includes('kubernetes') || toolName.includes('k8s')) {
      return 'mdi:kubernetes';
    }
    return 'mdi:tool';
  };

  const toggleToolExpansion = (toolId: string) => {
    setExpandedTools(prev => {
      const newSet = new Set(prev);
      if (newSet.has(toolId)) {
        newSet.delete(toolId);
      } else {
        newSet.add(toolId);
      }
      return newSet;
    });
  };

  const renderArgumentField = (
    toolId: string,
    fieldName: string,
    fieldValue: any,
    fieldSchema: any,
    _isRequired: boolean,
    hasError: boolean
  ) => {
    const fieldType = fieldSchema?.type || 'string';
    const fieldDescription = fieldSchema?.description;
    const enumValues = fieldSchema?.enum;

    const currentValue = editedArguments[toolId]?.[fieldName] ?? fieldValue;

    const handleFieldChange = (newValue: any) => {
      setEditedArguments(prev => ({
        ...prev,
        [toolId]: {
          ...prev[toolId],
          [fieldName]: newValue,
        },
      }));
    };

    // Render different input types based on schema
    if (fieldType === 'boolean') {
      return (
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(currentValue)}
              onChange={(e: any) => handleFieldChange(e.target.checked)}
              size="small"
            />
          }
          label={fieldName}
          sx={{ ml: 0 }}
        />
      );
    }

    if (enumValues && Array.isArray(enumValues)) {
      return (
        <FormControl size="small" sx={{ minWidth: 200 }} error={hasError}>
          <InputLabel>{fieldName}</InputLabel>
          <Select
            value={currentValue || ''}
            onChange={(e: any) => handleFieldChange(e.target.value)}
            label={fieldName}
          >
            {enumValues.map((option: any) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          {fieldDescription && <FormHelperText>{fieldDescription}</FormHelperText>}
        </FormControl>
      );
    }

    if (fieldType === 'number' || fieldType === 'integer') {
      return (
        <TextField
          size="small"
          type="number"
          label={fieldName}
          value={currentValue ?? ''}
          onChange={(e: any) =>
            handleFieldChange(
              fieldType === 'integer'
                ? parseInt(e.target.value) || 0
                : parseFloat(e.target.value) || 0
            )
          }
          helperText={fieldDescription}
          error={hasError}
          sx={{ minWidth: 200 }}
          inputProps={{
            min: fieldSchema?.minimum,
            max: fieldSchema?.maximum,
            step: fieldType === 'integer' ? 1 : 'any',
          }}
        />
      );
    }

    // Default to text field for strings and other types
    const isMultiline =
      fieldType === 'object' ||
      fieldType === 'array' ||
      (typeof currentValue === 'string' && currentValue.length > 50);

    return (
      <TextField
        size="small"
        label={fieldName}
        value={
          typeof currentValue === 'object'
            ? JSON.stringify(currentValue, null, 2)
            : String(currentValue ?? '')
        }
        onChange={(e: any) => {
          let newValue = e.target.value;

          // Try to parse as JSON for object/array fields
          if (fieldType === 'object' || fieldType === 'array') {
            try {
              newValue = JSON.parse(e.target.value);
            } catch {
              // Keep as string if not valid JSON
            }
          }

          handleFieldChange(newValue);
        }}
        multiline={isMultiline}
        rows={isMultiline ? 3 : 1}
        helperText={fieldDescription}
        error={hasError}
        sx={{ minWidth: 300 }}
        placeholder={fieldSchema?.example || `Enter ${fieldName}...`}
      />
    );
  };

  const renderArgumentsForTool = (tool: ToolCall, toolId: string) => {
    if (tool.type !== 'mcp' || !argumentsInitialized) {
      // Render simple view for regular tools or while loading
      return Object.entries(tool.arguments).map(([key, value]) => (
        <ListItem key={key} dense sx={{ py: 0.5 }}>
          <ListItemText
            primary={
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                {key}:
              </Typography>
            }
            secondary={
              <Typography variant="caption" sx={{ ml: 1 }}>
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
              </Typography>
            }
          />
        </ListItem>
      ));
    }

    const processedArgs = processedArguments[toolId];
    if (!processedArgs) return null;

    const { schema, errors } = processedArgs;
    const properties = schema?.inputSchema?.properties || {};
    const required = schema?.inputSchema?.required || [];
    const currentArgs = editedArguments[toolId] || {};

    // Show argument fields based on schema
    const fields = Object.entries(properties).map(([fieldName, fieldSchema]) => {
      const isRequired = required.includes(fieldName);
      const hasError = errors.some(error => error.includes(fieldName));
      const fieldValue = currentArgs[fieldName];

      return (
        <Box key={fieldName} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {fieldName}
            </Typography>
            {isRequired && <Chip label="Required" size="small" color="error" variant="outlined" />}
            {!isRequired && <Chip label="Optional" size="small" variant="outlined" />}

            {/* Show intelligent fill indicator */}
            {processedArgs.intelligentFills[fieldName] && (
              <Tooltip
                title={`AI-suggested: ${
                  processedArgs.intelligentFills[fieldName].reason
                } (Confidence: ${Math.round(
                  processedArgs.intelligentFills[fieldName].confidence * 100
                )}%)`}
                placement="top"
              >
                <Chip
                  label="AI-filled"
                  size="small"
                  color="success"
                  variant="outlined"
                  icon={<Icon icon="mdi:brain" style={{ fontSize: 14 }} />}
                />
              </Tooltip>
            )}

            {fieldSchema.description && (
              <Tooltip title={fieldSchema.description} placement="top">
                <IconButton size="small">
                  <Icon icon="mdi:information" style={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Show intelligent fill details */}
          {processedArgs.intelligentFills[fieldName] && (
            <Alert
              severity="info"
              variant="outlined"
              sx={{ mb: 1, py: 0.5 }}
              icon={<Icon icon="mdi:lightbulb" style={{ fontSize: 16 }} />}
            >
              <Typography variant="caption">
                <strong>AI Analysis:</strong> {processedArgs.intelligentFills[fieldName].reason}
                {processedArgs.intelligentFills[fieldName].confidence < 0.8 && (
                  <>
                    {' '}
                    • <em>Please verify this value</em>
                  </>
                )}
              </Typography>
            </Alert>
          )}

          {renderArgumentField(toolId, fieldName, fieldValue, fieldSchema, isRequired, hasError)}
        </Box>
      );
    });

    // Show validation errors
    if (errors.length > 0) {
      fields.push(
        <Alert key="errors" severity="warning" sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            Validation Issues:
          </Typography>
          {errors.map((error, index) => (
            <Typography key={index} variant="caption" sx={{ display: 'block' }}>
              • {error}
            </Typography>
          ))}
        </Alert>
      );
    }

    return fields;
  };

  const mcpTools = toolCalls.filter(tool => tool.type === 'mcp');

  // Check if any action is in progress
  const isActionInProgress = loading || isApproving || isDenying;

  if (loading || isApproving) {
    return (
      <Card
        variant="outlined"
        sx={{
          maxWidth: 600,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">
            {isApproving ? 'Approving and executing tools...' : 'Executing approved tools...'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Show denying state
  if (isDenying) {
    return (
      <Card
        variant="outlined"
        sx={{
          maxWidth: 600,
          backgroundColor: theme.palette.background.paper,
          borderColor: theme.palette.error.main,
        }}
      >
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={20} color="error" />
          <Typography variant="body2" color="error">
            Denying tool execution...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      variant="outlined"
      sx={{
        maxWidth: 600,
        backgroundColor: theme.palette.background.paper,
        borderColor: theme.palette.divider,
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Icon icon="mdi:shield-check" style={{ color: theme.palette.primary.main }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Tool Execution Required
          </Typography>
          <Chip
            label={`${toolCalls.length} tool${toolCalls.length > 1 ? 's' : ''}`}
            size="small"
            variant="outlined"
            color="primary"
          />
        </Box>

        {/* Summary */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          The assistant wants to execute {toolCalls.length} tool{toolCalls.length > 1 ? 's' : ''}:
        </Typography>

        {/* Collapsible tool list */}
        <Box sx={{ mb: 2 }}>
          {toolCalls.map((tool, index) => (
            <Box key={tool.id} sx={{ mb: index < toolCalls.length - 1 ? 1 : 0 }}>
              {/* Tool header - always visible and clickable */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                  backgroundColor: expandedTools.has(tool.id)
                    ? theme.palette.action.selected
                    : 'transparent',
                }}
                onClick={() => toggleToolExpansion(tool.id)}
              >
                <IconButton size="small" sx={{ p: 0.5 }}>
                  <Icon
                    icon={expandedTools.has(tool.id) ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                    style={{ fontSize: 16 }}
                  />
                </IconButton>
                <Icon icon={getToolIcon(tool.name, tool.type)} style={{ fontSize: 18 }} />
                <Typography variant="body2" sx={{ fontWeight: 'bold', flex: 1 }}>
                  {tool.name}
                </Typography>
                {tool.type === 'mcp' && (
                  <Chip label="MCP" size="small" color="info" variant="outlined" />
                )}
                {tool.description && (
                  <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200 }}>
                    {tool.description.length > 50
                      ? `${tool.description.substring(0, 50)}...`
                      : tool.description}
                  </Typography>
                )}
              </Box>

              {/* Tool details - collapsible */}
              <Collapse in={expandedTools.has(tool.id)}>
                <Box
                  sx={{
                    p: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    borderTop: 0,
                    borderRadius: '0 0 4px 4px',
                    backgroundColor: theme.palette.background.default,
                  }}
                >
                  {/* Tool description */}
                  {tool.description && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        Description
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tool.description}
                      </Typography>
                    </Box>
                  )}

                  {/* Tool arguments */}
                  {(Object.keys(tool.arguments).length > 0 || tool.type === 'mcp') && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Arguments {tool.type === 'mcp' ? '(editable)' : ''}
                      </Typography>
                      {tool.type === 'mcp' ? (
                        <Box>{renderArgumentsForTool(tool, tool.id)}</Box>
                      ) : (
                        <Box sx={{ ml: 1 }}>
                          {Object.entries(tool.arguments).map(([key, value]) => (
                            <Box key={key} sx={{ mb: 1 }}>
                              <Typography
                                variant="body2"
                                component="span"
                                sx={{ fontWeight: 'bold' }}
                              >
                                {key}:{' '}
                              </Typography>
                              <Typography variant="body2" component="span" color="text.secondary">
                                {typeof value === 'object'
                                  ? JSON.stringify(value, null, 2)
                                  : String(value)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Box>
          ))}
        </Box>

        {/* Contextual info */}
        <Alert severity="info" sx={{ mb: 2, py: 0.5 }}>
          <Typography variant="caption">
            {mcpTools.length > 0
              ? `${
                  mcpTools.length > 1 ? 'These MCP tools have' : 'This MCP tool has'
                } been configured with AI-analyzed arguments from your request. Click on any tool above to view details and edit arguments.`
              : 'These tools will access your Kubernetes cluster and other systems. Click on any tool above to view details.'}
          </Typography>
        </Alert>

        {/* Loading state for argument processing */}
        {!argumentsInitialized && mcpTools.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Processing intelligent argument suggestions...
            </Typography>
          </Box>
        )}

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleDeny}
            startIcon={
              isDenying ? <CircularProgress size={14} color="inherit" /> : <Icon icon="mdi:close" />
            }
            disabled={isActionInProgress}
            color={isDenying ? 'error' : 'inherit'}
            sx={{
              opacity: isDenying ? 0.7 : 1,
              cursor: isActionInProgress ? 'not-allowed' : 'pointer',
            }}
          >
            {isDenying ? 'Denying...' : 'Deny'}
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleApprove}
            startIcon={
              isApproving ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <Icon icon="mdi:check-bold" />
              )
            }
            disabled={
              isActionInProgress ||
              selectedToolIds.length === 0 ||
              (!argumentsInitialized && mcpTools.length > 0)
            }
            color="primary"
            sx={{
              opacity: isApproving ? 0.7 : 1,
              cursor: isActionInProgress ? 'not-allowed' : 'pointer',
            }}
          >
            {isApproving
              ? 'Executing...'
              : `Execute ${toolCalls.length} Tool${toolCalls.length > 1 ? 's' : ''}`}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default InlineToolConfirmation;
