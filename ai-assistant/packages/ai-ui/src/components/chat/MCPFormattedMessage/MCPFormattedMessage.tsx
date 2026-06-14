import type { FormattedMCPOutput } from '@headlamp-k8s/ai-common/mcp/tools/formattedOutput';
import type { ArgumentMap } from '@headlamp-k8s/ai-common/mcp/tools/types';
import { Icon } from '@iconify/react';
import { Alert, Box, Paper, Typography } from '@mui/material';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import MCPOutputDisplay from '../../mcpOutput/MCPOutputDisplay/MCPOutputDisplay';

/** Props for {@link MCPFormattedMessage}. */
export interface MCPFormattedMessageProps {
  /** Raw message content that may contain formatted MCP output JSON. */
  content: string;
  /** Whether to render assistant-specific framing around the message. */
  isAssistant?: boolean;
  /** Retries the original tool call when retry metadata is present. */
  onRetryTool?: (toolName: string, args: ArgumentMap) => void;
}

/** Parsed MCP payload extracted from a message string. */
interface ParsedMCPContent {
  /** Indicates that the payload uses the formatted MCP structure. */
  formatted: boolean;
  /** Structured MCP output to render. */
  mcpOutput: FormattedMCPOutput;
  /** Original raw output preserved for export. */
  raw: string;
  /** Whether the payload represents an error response. */
  isError?: boolean;
  /** Original tool arguments used for retry. */
  originalArgs?: ArgumentMap;
  /** Fallback tool name when output metadata is absent. */
  toolName?: string;
}

const OUTPUT_TYPES = new Set(['table', 'metrics', 'list', 'graph', 'text', 'error', 'raw']);

/** @returns Whether an untrusted value is a non-null object mapping. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** @returns Whether an untrusted value is an array containing only strings. */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

/** @returns Whether an untrusted value satisfies the formatted MCP output contract. */
function isFormattedMCPOutput(value: unknown): value is FormattedMCPOutput {
  if (
    !isRecord(value) ||
    typeof value.type !== 'string' ||
    !OUTPUT_TYPES.has(value.type) ||
    typeof value.title !== 'string' ||
    typeof value.summary !== 'string' ||
    !isRecord(value.data)
  ) {
    return false;
  }
  if (value.data.headers !== undefined && !isStringArray(value.data.headers)) return false;
  if (
    value.data.rows !== undefined &&
    (!Array.isArray(value.data.rows) || !value.data.rows.every(Array.isArray))
  ) {
    return false;
  }
  for (const field of ['insights', 'warnings', 'actionable_items'] as const) {
    if (value[field] !== undefined && !isStringArray(value[field])) return false;
  }
  if (value.metadata !== undefined) {
    if (
      !isRecord(value.metadata) ||
      typeof value.metadata.toolName !== 'string' ||
      typeof value.metadata.responseSize !== 'number' ||
      typeof value.metadata.processingTime !== 'number' ||
      (value.metadata.dataPoints !== undefined && typeof value.metadata.dataPoints !== 'number')
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Parses an untrusted message into the formatted MCP contract.
 *
 * @param content - Raw conversation message content.
 * @returns Valid formatted payload, or null for unrelated/malformed content.
 */
function parseMCPContent(content: string): ParsedMCPContent | null {
  try {
    const value: unknown = JSON.parse(content);
    if (!isRecord(value) || value.formatted !== true || !isFormattedMCPOutput(value.mcpOutput)) {
      return null;
    }
    return {
      formatted: true,
      mcpOutput: value.mcpOutput,
      raw: typeof value.raw === 'string' ? value.raw : '',
      isError: value.isError === true,
      originalArgs: isRecord(value.originalArgs) ? value.originalArgs : undefined,
      toolName: typeof value.toolName === 'string' ? value.toolName : undefined,
    };
  } catch {
    return null;
  }
}

/** @returns Whether raw message content satisfies the formatted MCP message contract. */
export function isFormattedMCPMessage(content: string): boolean {
  return parseMCPContent(content) !== null;
}

/** @returns Filesystem-safe export base name. */
function getExportName(toolName: string | undefined): string {
  return (
    (toolName || 'mcp-output').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') ||
    'mcp-output'
  );
}

/** @returns One quoted CSV cell with embedded quotes escaped. */
function encodeCsvCell(value: unknown): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

/** Renders AI-formatted MCP output messages and exposes export and retry actions when available. */
const MCPFormattedMessage: React.FC<MCPFormattedMessageProps> = ({
  content,
  isAssistant = true,
  onRetryTool,
}) => {
  const { t } = useTranslation();

  const mcpContent = parseMCPContent(content);

  // If not formatted MCP content, return null (let other components handle it)
  if (!mcpContent) {
    return null;
  }

  const handleExport = (format: 'json' | 'csv' | 'txt'): void => {
    const { mcpOutput } = mcpContent;
    let exportData: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        exportData = JSON.stringify(mcpOutput.data, null, 2);
        filename = `${getExportName(mcpOutput.metadata?.toolName)}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        if (mcpOutput.type === 'table' && mcpOutput.data.headers && mcpOutput.data.rows) {
          const csvContent = [
            mcpOutput.data.headers.map(encodeCsvCell).join(','),
            ...mcpOutput.data.rows.map(row => row.map(encodeCsvCell).join(',')),
          ].join('\n');
          exportData = csvContent;
        } else {
          exportData = JSON.stringify(mcpOutput.data, null, 2);
        }
        filename = `${getExportName(mcpOutput.metadata?.toolName)}.csv`;
        mimeType = 'text/csv';
        break;
      case 'txt':
        exportData = mcpContent.raw;
        filename = `${getExportName(mcpOutput.metadata?.toolName)}.txt`;
        mimeType = 'text/plain';
        break;
      default:
        return;
    }

    // Create and download the file
    const blob = new Blob([exportData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    try {
      document.body.appendChild(link);
      link.click();
    } finally {
      link.remove();
      URL.revokeObjectURL(url);
    }
  };

  const retryToolName = mcpContent.mcpOutput.metadata?.toolName || mcpContent.toolName;
  const canRetry = Boolean(onRetryTool && mcpContent.originalArgs && retryToolName);
  const handleRetry = useCallback(() => {
    if (canRetry && onRetryTool && mcpContent.originalArgs && retryToolName) {
      onRetryTool(retryToolName, mcpContent.originalArgs);
    }
  }, [canRetry, mcpContent.originalArgs, onRetryTool, retryToolName]);

  return (
    <Box
      sx={{
        my: 2,
        maxWidth: '100%',
        overflowWrap: 'break-word',
        wordWrap: 'break-word',
        wordBreak: 'break-word',
        overflowX: 'auto', // Add horizontal scroll as fallback
        '& *': {
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflowWrap: 'break-word',
          wordWrap: 'break-word',
        },
        '& pre': {
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          maxWidth: '100%',
          overflowWrap: 'break-word',
          overflowX: 'auto', // Horizontal scroll for code blocks
        },
      }}
    >
      {isAssistant && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Icon
            icon={
              mcpContent.isError || mcpContent.mcpOutput.type === 'error'
                ? 'mdi:alert-circle'
                : 'mdi:robot'
            }
            style={{
              fontSize: 20,
              color:
                mcpContent.isError || mcpContent.mcpOutput.type === 'error' ? '#f44336' : undefined,
            }}
            aria-hidden="true"
          />
          <Typography variant="caption" color="text.secondary">
            {mcpContent.isError || mcpContent.mcpOutput.type === 'error'
              ? t('Tool Error - AI Analysis')
              : t('AI-Formatted Tool Output')}
          </Typography>
          {(mcpContent.isError || mcpContent.mcpOutput.type === 'error') && (
            <Alert severity="error" variant="outlined" sx={{ py: 0, px: 1, fontSize: '0.75rem' }}>
              {t('Tool Execution Failed')}
            </Alert>
          )}
        </Box>
      )}

      <MCPOutputDisplay
        output={mcpContent.mcpOutput}
        onExport={
          mcpContent.isError || mcpContent.mcpOutput.type === 'error' ? undefined : handleExport
        }
        onRetry={canRetry ? handleRetry : undefined}
        compact={false}
      />

      {/* Show processing info if available and not an error */}
      {mcpContent.mcpOutput.metadata &&
        !(mcpContent.isError || mcpContent.mcpOutput.type === 'error') && (
          <Paper
            variant="outlined"
            sx={{
              p: 1,
              mt: 1,
              bgcolor: 'action.hover',
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              <Icon
                icon="mdi:sparkles"
                style={{ marginRight: 4, fontSize: 14 }}
                aria-hidden="true"
              />
              {t('Processed by AI in {{processingTime}}ms', {
                processingTime: mcpContent.mcpOutput.metadata.processingTime,
              })}
              {mcpContent.mcpOutput.insights && mcpContent.mcpOutput.insights.length > 0 && (
                <>
                  {' '}
                  •{' '}
                  {t('{{count}} insights generated', {
                    count: mcpContent.mcpOutput.insights.length,
                  })}
                </>
              )}
              {mcpContent.mcpOutput.actionable_items &&
                mcpContent.mcpOutput.actionable_items.length > 0 && (
                  <>
                    {' '}
                    •{' '}
                    {t('{{count}} action items', {
                      count: mcpContent.mcpOutput.actionable_items.length,
                    })}
                  </>
                )}
            </Typography>
          </Paper>
        )}

      {/* Show error-specific info */}
      {(mcpContent.isError || mcpContent.mcpOutput.type === 'error') &&
        mcpContent.mcpOutput.metadata && (
          <Paper
            variant="outlined"
            sx={{
              p: 1,
              mt: 1,
              bgcolor: 'error.50',
              borderColor: 'error.light',
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" color="error.main">
              <Icon icon="mdi:bug" style={{ marginRight: 4, fontSize: 14 }} aria-hidden="true" />
              {t('Error analyzed by AI in {{processingTime}}ms • Tool: {{toolName}}', {
                processingTime: mcpContent.mcpOutput.metadata.processingTime,
                toolName: mcpContent.mcpOutput.metadata.toolName,
              })}
            </Typography>
          </Paper>
        )}
    </Box>
  );
};

/** Wraps a message component so formatted MCP payloads render with {@link MCPFormattedMessage}. */
export const withMCPFormatting = <P extends object>(
  Component: React.ComponentType<P & { content: string }>
) => {
  return (props: P & MCPFormattedMessageProps) => {
    return parseMCPContent(props.content) ? (
      <MCPFormattedMessage
        content={props.content}
        isAssistant={props.isAssistant}
        onRetryTool={props.onRetryTool}
      />
    ) : (
      <Component {...props} />
    );
  };
};

export default MCPFormattedMessage;
