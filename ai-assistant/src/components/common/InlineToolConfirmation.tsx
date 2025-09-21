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
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputLabel,
  List,
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
  compact = false,
  userContext,
}) => {
  const theme = useTheme();
  const [selectedToolIds] = useState<string[]>(toolCalls.map(tool => tool.id));
  const [showDetails, setShowDetails] = useState(!compact);

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
  const regularTools = toolCalls.filter(tool => tool.type === 'regular');

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
          {compact
            ? `Allow execution of ${toolCalls.length} tool${toolCalls.length > 1 ? 's' : ''}?`
            : `The following tool${toolCalls.length > 1 ? 's' : ''} need${
                toolCalls.length > 1 ? '' : 's'
              } permission to execute:`}
        </Typography>

        {/* Tool summary when compact */}
        {compact && (
          <Box sx={{ mb: 2 }}>
            {toolCalls.map(tool => (
              <Chip
                key={tool.id}
                label={tool.name}
                size="small"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
                icon={<Icon icon={getToolIcon(tool.name, tool.type)} />}
              />
            ))}
          </Box>
        )}

        {/* Expandable details */}
        {compact && !showDetails && (
          <Box sx={{ mb: 2 }}>
            {/* MCP Tools */}
            {mcpTools.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                  MCP Tools:
                </Typography>
                {mcpTools.map(tool => (
                  <Box key={tool.id} sx={{ ml: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Icon icon={getToolIcon(tool.name, tool.type)} style={{ fontSize: 16 }} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {tool.name}
                      </Typography>
                      <Chip label="MCP" size="small" color="info" variant="outlined" />
                    </Box>
                    {tool.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 3 }}>
                        {tool.description}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}

            {/* Regular Tools */}
            {regularTools.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  System Tools:
                </Typography>
                {regularTools.map(tool => (
                  <Box key={tool.id} sx={{ ml: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Icon icon={getToolIcon(tool.name, tool.type)} style={{ fontSize: 16 }} />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {tool.name}
                      </Typography>
                    </Box>
                    {tool.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 3 }}>
                        {tool.description}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Toggle details button for compact mode */}
        {compact && (
          <Box sx={{ mb: 1 }}>
            <Button
              size="small"
              startIcon={<Icon icon={showDetails ? 'mdi:chevron-up' : 'mdi:chevron-down'} />}
              onClick={() => setShowDetails(!showDetails)}
              sx={{ p: 0, minWidth: 'auto' }}
            >
              <Typography variant="caption">
                {showDetails ? 'Hide details' : 'Show details'}
              </Typography>
            </Button>
          </Box>
        )}

        {/* Detailed view */}
        <Collapse in={showDetails}>
          <Box sx={{ mt: 1 }}>
            {toolCalls.map((tool, index) => (
              <Box key={tool.id}>
                {index > 0 && <Divider sx={{ my: 1 }} />}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Icon icon={getToolIcon(tool.name, tool.type)} style={{ fontSize: 16 }} />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {tool.name}
                  </Typography>
                  {tool.type === 'mcp' && (
                    <Chip label="MCP" size="small" color="info" variant="outlined" />
                  )}
                </Box>

                {tool.description && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1 }}
                  >
                    {tool.description}
                  </Typography>
                )}

                {(Object.keys(tool.arguments).length > 0 || tool.type === 'mcp') && (
                  <Box sx={{ ml: 2, mb: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}
                    >
                      Arguments {tool.type === 'mcp' ? '(editable):' : ':'}
                    </Typography>
                    {tool.type === 'mcp' ? (
                      <Box sx={{ pl: 1 }}>{renderArgumentsForTool(tool, tool.id)}</Box>
                    ) : (
                      <List dense sx={{ pl: 1 }}>
                        {Object.entries(tool.arguments).map(([key, value]) => (
                          <ListItem key={key} dense sx={{ py: 0.5 }}>
                            <ListItemText
                              primary={
                                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                  {key}:
                                </Typography>
                              }
                              secondary={
                                <Typography
                                  variant="caption"
                                  sx={{ ml: 1, wordBreak: 'break-word' }}
                                >
                                  {typeof value === 'object'
                                    ? JSON.stringify(value, null, 2)
                                    : String(value)}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Collapse>

        {/* Warning */}
        <Alert severity="info" sx={{ mb: 2, py: 0.5 }}>
          <Typography variant="caption">
            {mcpTools.length > 0
              ? 'MCP tool arguments have been intelligently analyzed and pre-filled based on your request. Arguments marked "AI-filled" were extracted from your message or context. Review and modify as needed.'
              : 'These tools will access external systems. Review the details before approving.'}
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
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
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
                <Icon icon="mdi:check" />
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
            {isApproving ? 'Approving...' : `Allow (${selectedToolIds.length})`}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default InlineToolConfirmation;
