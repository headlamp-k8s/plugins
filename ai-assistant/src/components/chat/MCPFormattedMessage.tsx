import { Icon } from '@iconify/react';
import { Alert, Box, Paper, Typography } from '@mui/material';
import React, { useCallback } from 'react';
import { usePromptWidth } from '../../contexts/PromptWidthContext';
import { FormattedMCPOutput } from '../../langchain/formatters/MCPOutputFormatter';
import MCPOutputDisplay from '../mcpOutput/MCPOutputDisplay';

interface MCPFormattedMessageProps {
  content: string;
  isAssistant?: boolean;
  onRetryTool?: (toolName: string, args: Record<string, any>) => void;
}

interface ParsedMCPContent {
  formatted: boolean;
  mcpOutput: FormattedMCPOutput;
  raw: string;
  isError?: boolean;
}

const MCPFormattedMessage: React.FC<MCPFormattedMessageProps> = ({
  content,
  isAssistant = true,
  onRetryTool,
}) => {
  const widthContext = usePromptWidth();
  console.log('From context width ', widthContext.promptWidth);
  // Try to parse the content as formatted MCP output
  const parseContent = (): ParsedMCPContent | null => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.formatted && parsed.mcpOutput) {
        return parsed as ParsedMCPContent;
      }
    } catch (error) {
      // Not formatted MCP content
    }
    return null;
  };

  const mcpContent = parseContent();

  // If not formatted MCP content, return null (let other components handle it)
  if (!mcpContent) {
    return null;
  }

  const handleExport = (format: 'json' | 'csv' | 'txt') => {
    const { mcpOutput } = mcpContent;
    let exportData: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        exportData = JSON.stringify(mcpOutput.data, null, 2);
        filename = `${mcpOutput.metadata?.toolName || 'mcp-output'}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        if (mcpOutput.type === 'table' && mcpOutput.data.headers && mcpOutput.data.rows) {
          const csvContent = [
            mcpOutput.data.headers.join(','),
            ...mcpOutput.data.rows.map((row: any[]) =>
              row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
            ),
          ].join('\n');
          exportData = csvContent;
        } else {
          exportData = JSON.stringify(mcpOutput.data, null, 2);
        }
        filename = `${mcpOutput.metadata?.toolName || 'mcp-output'}.csv`;
        mimeType = 'text/csv';
        break;
      case 'txt':
        exportData = mcpContent.raw;
        filename = `${mcpOutput.metadata?.toolName || 'mcp-output'}.txt`;
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
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRetry = useCallback(() => {
    if (!onRetryTool) {
      console.log('Retry requested but no retry handler available');
      return;
    }

    try {
      // Parse the content to extract originalArgs and tool information
      const parsedContent = JSON.parse(content);

      // Look for originalArgs in the parsed content
      const originalArgs = parsedContent.originalArgs;

      if (!originalArgs) {
        console.error('No originalArgs found in content for retry');
        return;
      }

      // Extract tool name from the formatted output or use a fallback
      let toolName = '';
      if (parsedContent.mcpOutput?.metadata?.toolName) {
        toolName = parsedContent.mcpOutput.metadata.toolName;
      } else if (parsedContent.toolName) {
        toolName = parsedContent.toolName;
      } else {
        console.error('No tool name found in content for retry');
        return;
      }

      console.log('Retrying tool:', toolName, 'with args:', originalArgs);
      onRetryTool(toolName, originalArgs);
    } catch (error) {
      console.error('Failed to parse content for retry:', error);
    }
  }, [content, onRetryTool]);

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
          />
          <Typography variant="caption" color="text.secondary">
            {mcpContent.isError || mcpContent.mcpOutput.type === 'error'
              ? 'Tool Error - AI Analysis'
              : 'AI-Formatted Tool Output'}
          </Typography>
          {(mcpContent.isError || mcpContent.mcpOutput.type === 'error') && (
            <Alert severity="error" variant="outlined" sx={{ py: 0, px: 1, fontSize: '0.75rem' }}>
              Tool Execution Failed
            </Alert>
          )}
        </Box>
      )}

      <MCPOutputDisplay
        output={mcpContent.mcpOutput}
        onExport={
          mcpContent.isError || mcpContent.mcpOutput.type === 'error' ? undefined : handleExport
        }
        onRetry={handleRetry}
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
              <Icon icon="mdi:sparkles" style={{ marginRight: 4, fontSize: 14 }} />
              Processed by AI in {mcpContent.mcpOutput.metadata.processingTime}ms
              {mcpContent.mcpOutput.insights && mcpContent.mcpOutput.insights.length > 0 && (
                <> • {mcpContent.mcpOutput.insights.length} insights generated</>
              )}
              {mcpContent.mcpOutput.actionable_items &&
                mcpContent.mcpOutput.actionable_items.length > 0 && (
                  <> • {mcpContent.mcpOutput.actionable_items.length} action items</>
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
              <Icon icon="mdi:bug" style={{ marginRight: 4, fontSize: 14 }} />
              Error analyzed by AI in {mcpContent.mcpOutput.metadata.processingTime}ms • Tool:{' '}
              {mcpContent.mcpOutput.metadata.toolName}
            </Typography>
          </Paper>
        )}
    </Box>
  );
};

// Helper component to detect and render MCP content in existing messages
export const withMCPFormatting = <P extends object>(
  Component: React.ComponentType<P & { content: string }>
) => {
  return (props: P & { content: string }) => {
    const mcpFormatted = <MCPFormattedMessage content={props.content} />;

    // If content is formatted MCP output, show formatted version
    try {
      const parsed = JSON.parse(props.content);
      if (parsed.formatted && parsed.mcpOutput) {
        return mcpFormatted;
      }
    } catch {
      // Not JSON or not formatted MCP content, use original component
    }

    return <Component {...props} />;
  };
};

export default MCPFormattedMessage;
