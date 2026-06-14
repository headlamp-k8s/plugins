import { MCPArgumentProcessor } from '@headlamp-k8s/ai-common/mcp/tools/ArgumentProcessor';
import type {
  ArgumentMap,
  JSONSchemaProperty,
  ProcessedArguments,
  UserContext,
} from '@headlamp-k8s/ai-common/mcp/tools/types';
import type { ToolCall } from '@headlamp-k8s/ai-common/tools/types';
import { Icon } from '@iconify/react';
import {
  Alert,
  Box,
  Button,
  ButtonBase,
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
import { useTranslation } from 'react-i18next';

/** Props for {@link InlineToolConfirmation}. */
export interface InlineToolConfirmationProps {
  /** Tool calls that require approval. */
  toolCalls: ToolCall[];
  /** Executes the selected tool calls. */
  onApprove: (approvedToolIds: string[]) => void | Promise<void>;
  /** Rejects the pending tool calls. */
  onDeny: () => void | Promise<void>;
  /** Whether approval handling is currently in progress. */
  loading?: boolean;
  /** Optional chat context used to prefill MCP arguments. */
  userContext?: UserContext;
}

/**
 * Shows tool approval inline in chat and lets users inspect or edit tool arguments.
 *
 * @param props - Inline tool confirmation properties.
 * @returns Inline approval UI or an action-progress state.
 */
const InlineToolConfirmation: React.FC<InlineToolConfirmationProps> = ({
  toolCalls,
  onApprove,
  onDeny,
  loading = false,
  userContext,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const selectedToolIds = toolCalls.map(tool => tool.id);
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set()); // Track which tools are expanded

  // State to track processed arguments for each tool
  const [processedArguments, setProcessedArguments] = useState<Record<string, ProcessedArguments>>(
    {}
  );
  const [editedArguments, setEditedArguments] = useState<Record<string, ArgumentMap>>({});
  const [editErrors, setEditErrors] = useState<Record<string, Record<string, string>>>({});
  const [argumentsInitialized, setArgumentsInitialized] = useState(false);

  // State to track deny action
  const [isDenying, setIsDenying] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Initialize arguments with intelligent processing
  useEffect(() => {
    let cancelled = false;
    setArgumentsInitialized(false);
    setEditErrors({});

    /**
     * Processes MCP arguments and copies regular arguments into editable state.
     *
     * @returns Promise that settles after current tool arguments are initialized.
     */
    const initializeArguments = async (): Promise<void> => {
      const processed: Record<string, ProcessedArguments> = {};
      const edited: Record<string, ArgumentMap> = {};

      for (const tool of toolCalls) {
        if (tool.type === 'mcp') {
          // Process MCP tool arguments with intelligent defaults
          try {
            const processedArgs = await MCPArgumentProcessor.processArguments(
              tool.name,
              tool.arguments,
              userContext
            );
            processed[tool.id] = processedArgs;
            edited[tool.id] = { ...processedArgs.processed };
          } catch (error) {
            console.error(`Failed to process arguments for ${tool.name}:`, error);
            edited[tool.id] = { ...tool.arguments };
          }
        } else {
          // For regular tools, use arguments as-is
          edited[tool.id] = { ...tool.arguments };
        }
      }

      if (cancelled) return;
      setProcessedArguments(processed);
      setEditedArguments(edited);
      setArgumentsInitialized(true);
    };

    void initializeArguments();
    return () => {
      cancelled = true;
    };
  }, [toolCalls, userContext]);

  /** Approves selected tools after applying edited arguments. @returns Approval completion. */
  const handleApprove = async (): Promise<void> => {
    if (isApproving || isDenying) return; // Prevent double-clicks

    if (selectedToolIds.length === 0) {
      handleDeny();
      return;
    }

    setIsApproving(true);

    try {
      // Update the original toolCalls with edited arguments
      toolCalls.forEach(tool => {
        if (selectedToolIds.includes(tool.id) && editedArguments[tool.id]) {
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

      // Call onApprove and wait for it to complete
      await onApprove(selectedToolIds);
    } catch (error) {
      console.error('Error during tool approval:', error);
    } finally {
      // Always reset the approving state, whether success or error
      setIsApproving(false);
    }
  };

  /** Rejects all pending tools. @returns Denial completion. */
  const handleDeny = async (): Promise<void> => {
    if (isDenying || isApproving) return; // Prevent double-clicks and conflicts

    setIsDenying(true);

    try {
      // Call onDeny and wait for it to complete
      await onDeny();
    } catch (error) {
      console.error('Error during tool denial:', error);
    } finally {
      // Always reset the denying state
      setIsDenying(false);
    }
  };

  /**
   * Selects an icon for a tool source and name.
   *
   * @param toolName - Tool name to classify.
   * @param toolType - Tool implementation source.
   * @returns Iconify icon identifier.
   */
  const getToolIcon = (toolName: string, toolType: 'mcp' | 'regular'): string => {
    if (toolType === 'mcp') {
      return 'mdi:connection'; // Use connection icon for MCP tools
    }

    if (toolName.includes('kubernetes') || toolName.includes('k8s')) {
      return 'mdi:kubernetes';
    }
    return 'mdi:tool';
  };

  /** Toggles argument details for one tool. @param toolId - Tool identifier. @returns No value. */
  const toggleToolExpansion = (toolId: string): void => {
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

  /**
   * Renders an editable control appropriate for one JSON Schema field.
   *
   * @param toolId - Tool identifier used to locate editable state.
   * @param fieldName - Argument name used for labels and state keys.
   * @param fieldValue - Initial field value when no edit exists.
   * @param fieldSchema - JSON Schema metadata controlling the input type.
   * @param hasError - Whether validation reported an error for this field.
   * @returns Editable boolean, enum, number, structured, or text control.
   */
  const renderArgumentField = (
    toolId: string,
    fieldName: string,
    fieldValue: unknown,
    fieldSchema: JSONSchemaProperty,
    hasError: boolean
  ): React.ReactNode => {
    const fieldType = fieldSchema?.type || 'string';
    const fieldDescription = fieldSchema?.description;
    const fieldExample = 'example' in fieldSchema ? fieldSchema.example : undefined;
    const enumValues = fieldSchema.enum?.filter(
      (value): value is string | number => typeof value === 'string' || typeof value === 'number'
    );

    const currentValue = editedArguments[toolId]?.[fieldName] ?? fieldValue;
    const editError = editErrors[toolId]?.[fieldName];

    /** Updates one edited argument value. @param newValue - Replacement value. @returns No value. */
    const handleFieldChange = (newValue: unknown): void => {
      setEditedArguments(prev => ({
        ...prev,
        [toolId]: {
          ...prev[toolId],
          [fieldName]: newValue,
        },
      }));
    };

    /**
     * Sets or clears the structured-input error for this field.
     *
     * @param message - Error message, or `undefined` when the value is valid.
     * @returns No value.
     */
    const setFieldEditError = (message?: string): void => {
      setEditErrors(previous => {
        const toolErrors = { ...previous[toolId] };
        if (message) toolErrors[fieldName] = message;
        else delete toolErrors[fieldName];
        return { ...previous, [toolId]: toolErrors };
      });
    };

    // Render different input types based on schema
    if (fieldType === 'boolean') {
      return (
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(currentValue)}
              onChange={event => handleFieldChange(event.target.checked)}
              size="small"
            />
          }
          label={fieldName}
          sx={{ ml: 0 }}
        />
      );
    }

    if (enumValues && Array.isArray(enumValues)) {
      const labelId = `${toolId}-${fieldName}-label`;
      return (
        <FormControl size="small" sx={{ minWidth: 200 }} error={hasError}>
          <InputLabel id={labelId}>{fieldName}</InputLabel>
          <Select
            labelId={labelId}
            value={currentValue || ''}
            onChange={event => handleFieldChange(event.target.value)}
            label={fieldName}
          >
            {enumValues.map(option => (
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
          onChange={event => {
            const value = event.target.value;
            if (value === '') {
              handleFieldChange('');
              return;
            }
            const parsed = fieldType === 'integer' ? Number.parseInt(value, 10) : Number(value);
            handleFieldChange(Number.isNaN(parsed) ? value : parsed);
          }}
          helperText={fieldDescription}
          error={hasError}
          sx={{ minWidth: 200 }}
          inputProps={{
            min: fieldSchema?.minimum,
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
        onChange={event => {
          let newValue: unknown = event.target.value;

          // Try to parse as JSON for object/array fields
          if (fieldType === 'object' || fieldType === 'array') {
            try {
              const parsed: unknown = JSON.parse(event.target.value);
              if (
                (fieldType === 'array' && Array.isArray(parsed)) ||
                (fieldType === 'object' &&
                  typeof parsed === 'object' &&
                  parsed !== null &&
                  !Array.isArray(parsed))
              ) {
                newValue = parsed;
                setFieldEditError();
              } else {
                setFieldEditError(
                  fieldType === 'array'
                    ? t('Enter a valid JSON array.')
                    : t('Enter a valid JSON object.')
                );
              }
            } catch {
              setFieldEditError(t('Enter valid JSON.'));
            }
          }

          handleFieldChange(newValue);
        }}
        multiline={isMultiline}
        rows={isMultiline ? 3 : 1}
        helperText={editError ?? fieldDescription}
        error={hasError || Boolean(editError)}
        sx={{ minWidth: 300 }}
        placeholder={
          typeof fieldExample === 'string'
            ? fieldExample
            : t('Enter {{field}}...', { field: fieldName })
        }
      />
    );
  };

  /**
   * Renders read-only or schema-driven editable arguments for one tool.
   *
   * @param tool - Tool call whose arguments should be shown.
   * @param toolId - Tool identifier used for processed state.
   * @returns Argument fields, validation messages, or no content.
   */
  const renderArgumentsForTool = (tool: ToolCall, toolId: string): React.ReactNode => {
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
            {isRequired && (
              <Chip label={t('Required')} size="small" color="error" variant="outlined" />
            )}
            {!isRequired && <Chip label={t('Optional')} size="small" variant="outlined" />}

            {/* Show intelligent fill indicator */}
            {processedArgs.intelligentFills[fieldName] && (
              <Tooltip
                title={t('AI-suggested: {{reason}} (Confidence: {{confidence}}%)', {
                  reason: processedArgs.intelligentFills[fieldName].reason,
                  confidence: Math.round(
                    processedArgs.intelligentFills[fieldName].confidence * 100
                  ),
                })}
                placement="top"
              >
                <Chip
                  label={t('AI-filled')}
                  size="small"
                  color="success"
                  variant="outlined"
                  icon={<Icon icon="mdi:brain" style={{ fontSize: 14 }} />}
                />
              </Tooltip>
            )}

            {fieldSchema.description && (
              <Tooltip title={fieldSchema.description} placement="top">
                <IconButton size="small" aria-label={t('About {{field}}', { field: fieldName })}>
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
                <strong>{t('AI Analysis:')}</strong>{' '}
                {processedArgs.intelligentFills[fieldName].reason}
                {processedArgs.intelligentFills[fieldName].confidence < 0.8 && (
                  <>
                    {' '}
                    • <em>{t('Please verify this value')}</em>
                  </>
                )}
              </Typography>
            </Alert>
          )}

          {renderArgumentField(toolId, fieldName, fieldValue, fieldSchema, hasError)}
        </Box>
      );
    });

    // Show validation errors
    if (errors.length > 0) {
      fields.push(
        <Alert key="errors" severity="warning" sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            {t('Validation Issues:')}
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
  const hasEditErrors = Object.values(editErrors).some(toolErrors =>
    Object.values(toolErrors).some(Boolean)
  );

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
          <CircularProgress size={20} aria-label={t('Executing tools')} />
          <Typography variant="body2">
            {isApproving ? t('Approving and executing tools...') : t('Executing approved tools...')}
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
          <CircularProgress size={20} color="error" aria-label={t('Denying tools')} />
          <Typography variant="body2" color="error">
            {t('Denying tool execution...')}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      role="region"
      aria-label={t('Tool execution approval')}
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
            {t('Tool Execution Required')}
          </Typography>
          <Chip
            label={t(toolCalls.length === 1 ? '{{count}} tool' : '{{count}} tools', {
              count: toolCalls.length,
            })}
            size="small"
            variant="outlined"
            color="primary"
          />
        </Box>

        {/* Summary */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t(
            toolCalls.length === 1
              ? 'The assistant wants to execute {{count}} tool:'
              : 'The assistant wants to execute {{count}} tools:',
            { count: toolCalls.length }
          )}
        </Typography>

        {/* Collapsible tool list */}
        <Box sx={{ mb: 2 }}>
          {toolCalls.map((tool, index) => (
            <Box key={tool.id} sx={{ mb: index < toolCalls.length - 1 ? 1 : 0 }}>
              {/* Tool header - always visible and clickable */}
              <ButtonBase
                aria-controls={`tool-details-${tool.id}`}
                aria-expanded={expandedTools.has(tool.id)}
                aria-label={t('Toggle details for {{tool}}', { tool: tool.name })}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                  backgroundColor: expandedTools.has(tool.id)
                    ? theme.palette.action.selected
                    : 'transparent',
                }}
                onClick={() => toggleToolExpansion(tool.id)}
              >
                <Box component="span" sx={{ display: 'inline-flex', p: 0.5 }} aria-hidden="true">
                  <Icon
                    icon={expandedTools.has(tool.id) ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                    style={{ fontSize: 16 }}
                  />
                </Box>
                <Icon icon={getToolIcon(tool.name, tool.type)} style={{ fontSize: 18 }} />
                <Typography variant="body2" sx={{ fontWeight: 'bold', flex: 1 }}>
                  {tool.name}
                </Typography>
                {tool.type === 'mcp' && (
                  <Chip label={t('MCP')} size="small" color="info" variant="outlined" />
                )}
                {tool.description && (
                  <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200 }}>
                    {tool.description.length > 50
                      ? `${tool.description.substring(0, 50)}...`
                      : tool.description}
                  </Typography>
                )}
              </ButtonBase>

              {/* Tool details - collapsible */}
              <Collapse id={`tool-details-${tool.id}`} in={expandedTools.has(tool.id)}>
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
                        {t('Description')}
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
                        {tool.type === 'mcp' ? t('Arguments (editable)') : t('Arguments')}
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
              ? mcpTools.length > 1
                ? t(
                    'These MCP tools have been configured with AI-analyzed arguments from your request. Click on any tool above to view details and edit arguments.'
                  )
                : t(
                    'This MCP tool has been configured with AI-analyzed arguments from your request. Click on the tool above to view details and edit arguments.'
                  )
              : t(
                  'These tools will access your Kubernetes cluster and other systems. Click on any tool above to view details.'
                )}
          </Typography>
        </Alert>

        {/* Loading state for argument processing */}
        {!argumentsInitialized && mcpTools.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CircularProgress size={16} aria-label={t('Processing arguments')} />
            <Typography variant="caption" color="text.secondary">
              {t('Processing intelligent argument suggestions...')}
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
            {isDenying ? t('Denying...') : t('Deny')}
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
              hasEditErrors ||
              (!argumentsInitialized && mcpTools.length > 0)
            }
            color="primary"
            sx={{
              opacity: isApproving ? 0.7 : 1,
              cursor: isActionInProgress ? 'not-allowed' : 'pointer',
            }}
          >
            {isApproving
              ? t('Executing...')
              : t(toolCalls.length > 1 ? 'Execute {{count}} Tools' : 'Execute {{count}} Tool', {
                  count: toolCalls.length,
                })}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default InlineToolConfirmation;
