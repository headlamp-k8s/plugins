import { Icon } from '@iconify/react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Paper,
  Typography,
} from '@mui/material';
import React from 'react';
import YAML from 'yaml';

interface ToolResponseDisplayProps {
  toolCalls: any[];
  toolResponses: Record<string, string>;
  expandedTools: Record<string, boolean>;
  toggleExpand: (index: number) => void;
}

const ToolResponseDisplay: React.FC<ToolResponseDisplayProps> = ({
  toolCalls,
  toolResponses,
  expandedTools,
  toggleExpand,
}) => {
  // Format JSON for display
  const formatJson = (json: string): string => {
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch (e) {
      return json;
    }
  };

  // Check if string might be YAML
  const isYamlContent = (content: string): boolean => {
    try {
      const parsed = YAML.parse(content);
      return parsed && typeof parsed === 'object' && 'apiVersion' in parsed && 'kind' in parsed;
    } catch (e) {
      return false;
    }
  };

  // Determine if content is logs
  const isLogContent = (content: string, toolCall: any): boolean => {
    // Check if URL ends with /log or contains /log?
    const isLogUrl =
      toolCall.function?.name === 'http_request' &&
      JSON.parse(toolCall.function.arguments || '{}').url?.match(/\/log(\?|$)/);

    // Also check content for log patterns
    const hasLogPattern =
      content &&
      ((content.includes('\n') && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(content)) ||
        /\b(INFO|DEBUG|ERROR|WARNING|WARN)\b/i.test(content));

    // Check for Kubernetes API error responses related to logs
    const isLogErrorResponse =
      content &&
      content.includes('"kind":"Status"') &&
      content.includes('/log') &&
      content.includes('Error fetching logs');

    return isLogUrl || hasLogPattern || isLogErrorResponse;
  };

  // Check if the response contains an error
  const isErrorResponse = (content: string): boolean => {
    try {
      if (
        content.includes('error') ||
        content.includes('Error') ||
        content.includes('failed') ||
        content.includes('Failed')
      ) {
        // Check if it's a JSON error object
        if (content.trim().startsWith('{')) {
          const parsed = JSON.parse(content);
          return (
            parsed.error === true ||
            (typeof parsed.message === 'string' &&
              (parsed.message.includes('error') || parsed.message.includes('Error')))
          );
        }
        return true;
      }
      return false;
    } catch (e) {
      return content.includes('error') || content.includes('Error');
    }
  };

  // Format logs for display
  const formatLogs = (content: string): JSX.Element => {
    try {
      // Check if this is an error response in JSON format
      if (content.trim().startsWith('{') && content.includes('"error"')) {
        try {
          const error = JSON.parse(content);
          return <Alert severity="error">Error: {error.message || 'Failed to fetch logs'}</Alert>;
        } catch (e) {
          // Not JSON or couldn't parse
        }
      }

      // If wrapped in JSON response, extract the actual logs
      let logContent = content;
      try {
        const parsed = JSON.parse(content);
        if (parsed && parsed.logs) {
          logContent = parsed.logs;
        }
      } catch (e) {
        // Not JSON, use as is
      }

      // Split by lines and add highlighting
      const lines = logContent.split('\n');
      return (
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            whiteSpace: 'pre-wrap',
            maxHeight: '300px',
            overflow: 'auto',
          }}
        >
          {lines.map((line, i) => {
            let style = {};
            if (line.toLowerCase().includes('error') || line.includes('ERR')) {
              style = { color: '#f44336' }; // Red for errors
            } else if (line.toLowerCase().includes('warn') || line.includes('WARN')) {
              style = { color: '#ff9800' }; // Orange for warnings
            }

            return (
              <div key={i} style={style}>
                {line}
              </div>
            );
          })}
        </div>
      );
    } catch (e) {
      return <pre>{content}</pre>;
    }
  };

  // Format response based on content type and error status
  const renderResponse = (response: string, toolCall: any) => {
    // Check if it's an error first
    if (isErrorResponse(response)) {
      try {
        const parsed = JSON.parse(response);
        return (
          <Alert severity="error" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
            {parsed.message || 'An error occurred during the operation'}
          </Alert>
        );
      } catch (e) {
        // Not valid JSON, use text error
        return (
          <Alert severity="error" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
            {response}
          </Alert>
        );
      }
    }

    // Not an error, format based on content type
    if (isLogContent(response, toolCall)) {
      return formatLogs(response);
    } else if (isYamlContent(response)) {
      return (
        <Typography
          component="pre"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
          }}
        >
          {response}
        </Typography>
      );
    } else {
      return (
        <Typography
          component="pre"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
          }}
        >
          {formatJson(response)}
        </Typography>
      );
    }
  };

  return (
    <Box mt={2}>
      {toolCalls.map((toolCall, index) => {
        const toolCallId = toolCall.id;
        const response = toolResponses[toolCallId] || 'Waiting for response...';
        const args = JSON.parse(toolCall.function.arguments || '{}');
        const hasError = isErrorResponse(response);

        // Determine title/summary text based on tool type
        let summaryText = '';
        let iconName = 'mdi:api';

        if (toolCall.function?.name === 'http_request') {
          summaryText = `${args.method || 'GET'} ${args.url || ''}`;
          iconName = hasError ? 'mdi:alert-circle' : 'mdi:api';
        } else if (toolCall.function?.name === 'fetch_logs') {
          summaryText = `Logs: ${args.namespace}/${args.podName}`;
          if (args.containerName) {
            summaryText += `/${args.containerName}`;
          }
          iconName = hasError ? 'mdi:alert-circle' : 'mdi:text-box-outline';
        }

        return (
          <Accordion
            key={toolCallId}
            expanded={!!expandedTools[index] || hasError}
            onChange={() => toggleExpand(index)}
            sx={{
              mb: 1,
              '&.MuiPaper-root': { backgroundColor: 'background.paper' },
              border: '1px solid',
              borderColor: hasError ? 'error.main' : 'divider',
            }}
          >
            <AccordionSummary
              expandIcon={<Icon icon="mdi:chevron-down" />}
              aria-controls={`tool-panel-content-${index}`}
              id={`tool-panel-header-${index}`}
              sx={{
                backgroundColor: hasError ? 'rgba(244, 67, 54, 0.08)' : 'inherit',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Icon
                  icon={iconName}
                  style={{
                    marginRight: '8px',
                    color: hasError ? '#f44336' : 'inherit',
                  }}
                />
                <Typography
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    color: hasError ? '#f44336' : 'inherit',
                    fontWeight: hasError ? 'bold' : 'normal',
                  }}
                >
                  {summaryText}
                  {hasError && ' (Error)'}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Paper
                variant="outlined"
                sx={{
                  p: 1,
                  backgroundColor: 'background.default',
                  maxHeight: '400px',
                  overflow: 'auto',
                }}
              >
                <Typography variant="caption" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
                  {toolCall.function?.name === 'fetch_logs' ? 'Log Output:' : 'Response:'}
                </Typography>

                {renderResponse(response, toolCall)}
              </Paper>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default ToolResponseDisplay;
