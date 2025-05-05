import { Icon } from '@iconify/react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  CircularProgress,
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

  // Check if response is pending or not yet available
  const isPendingResponse = (response: string | undefined, toolCall: any): boolean => {
    if (!response || response === 'Waiting for response...') return true;
    
    // For non-GET requests, check if it's a pending confirmation message
    try {
      const args = JSON.parse(toolCall.function.arguments || '{}');
      if (args.method?.toUpperCase() !== 'GET') {
        // For non-GET requests, we might have a "pending_confirmation" status
        try {
          const parsed = JSON.parse(response);
          console.log('Parsed response:', parsed);
          // First check if it explicitly says "success" anywhere - this overrides pending status
          if (parsed.status === 'success' || 
              parsed.status === 'processing' ||
              (parsed.message && (
                parsed.message.toLowerCase().includes('successfully') ||
                parsed.message.toLowerCase().includes('deleted') ||
                parsed.message.toLowerCase().includes('updated') ||
                parsed.message.toLowerCase().includes('created') ||
                parsed.message.toLowerCase().includes('applied')
              ))) {
            return false;
          }
          
          // Check if the response indicates successful completion
          if ((parsed.kind && parsed.metadata)) {
            return false; // Not pending anymore, it completed
          }
          
          // Return true only if we explicitly have pending_confirmation status
          return parsed.status === 'pending_confirmation';
        } catch (e) {
          // Not JSON, check for text indicators of completion
          if (response.includes('successfully') || 
              response.includes('created') ||
              response.includes('deleted') ||  
              response.includes('updated') || 
              response.includes('applied')) {
            return false;
          }
          
          // Not JSON and no completion indicators - check if it contains pending text
          return response.toLowerCase().includes('pending') || 
                 response.toLowerCase().includes('waiting for confirmation');
        }
      }
    } catch (e) {
      // Error parsing args, check if the response contains pending text
      return response.toLowerCase().includes('pending') || 
             response.toLowerCase().includes('waiting for confirmation');
    }
    
    // Default case - not pending
    return false;
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

  // Check if response indicates operation success
  const isSuccessResponse = (response: string | undefined, toolCall: any): boolean => {
    if (!response) return false;
    
    // First check for direct string indicators
    if (response.includes('successfully') || 
        response.includes('created') || 
        response.includes('updated') || 
        response.includes('applied') ||
        response.includes('deleted')) {
      return true;
    }
    
    try {
      const args = JSON.parse(toolCall.function.arguments || '{}');
      
      // Only check for non-GET methods
      if (args.method?.toUpperCase() !== 'GET') {
        try {
          const parsed = JSON.parse(response);
          return parsed.status === 'success' || 
                 parsed.status === 'processing' ||
                 (parsed.kind && parsed.metadata) ||
                 (parsed.message && (
                   parsed.message.includes('successfully') || 
                   parsed.message.includes('created') ||
                   parsed.message.includes('updated') ||
                   parsed.message.includes('deleted') ||
                   parsed.message.includes('applied')
                 ));
        } catch (e) {
          // Not JSON, use text-based check already done above
        }
      }
    } catch (e) {
      // Error parsing args - rely on string check done at the beginning
    }
    
    return false;
  }

  // Format response based on content type and error status
  const renderResponse = (response: string | undefined, toolCall: any) => {
    // Check if it's pending
    if (isPendingResponse(response, toolCall)) {
      // Show a specific pending state
      const args = JSON.parse(toolCall.function.arguments || '{}');
      const isPendingModification = args.method?.toUpperCase() !== 'GET';
      
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
          <CircularProgress size={20} sx={{ mr: 2 }} />
          <Typography variant="body2">
            {isPendingModification
              ? `Waiting for confirmation to proceed with ${args.method?.toUpperCase()} request...`
              : 'Loading response...'}
          </Typography>
        </Box>
      );
    }
    
    const responseContent = response || '';
    
    // Check if it's a success response for non-GET request
    if (isSuccessResponse(responseContent, toolCall)) {
      try {
        const parsed = JSON.parse(responseContent);
        const message = parsed.message || 'Operation completed successfully';
        
        return (
          <Alert severity="success" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
            {message}
            {parsed.resourceType && parsed.name && (
              <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                {parsed.resourceType} "{parsed.name}" {parsed.namespace ? `in namespace "${parsed.namespace}"` : ''} 
                {parsed.status === 'success' ? ' processed successfully' : ''}
              </Typography>
            )}
          </Alert>
        );
      } catch (e) {
        // Not valid JSON, use text success
        return (
          <Alert severity="success" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
            {responseContent}
          </Alert>
        );
      }
    }
    
    // Check if it's an error first
    if (isErrorResponse(responseContent)) {
      try {
        const parsed = JSON.parse(responseContent);
        return (
          <Alert severity="error" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
            {parsed.message || 'An error occurred during the operation'}
          </Alert>
        );
      } catch (e) {
        // Not valid JSON, use text error
        return (
          <Alert severity="error" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
            {responseContent}
          </Alert>
        );
      }
    }

    // Not an error, format based on content type
    if (isLogContent(responseContent, toolCall)) {
      return formatLogs(responseContent);
    } else if (isYamlContent(responseContent)) {
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
          {responseContent}
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
          {formatJson(responseContent)}
        </Typography>
      );
    }
  };

  // When rendering the tool calls, group them by their function args to prevent duplicates
  const renderToolCallGroups = () => {
    // Group tool calls by their URL and method to detect duplicates
    const toolCallGroups = new Map<string, any[]>();
    
    toolCalls.forEach(toolCall => {
      try {
        const args = JSON.parse(toolCall.function.arguments || '{}');
        const key = `${args.method}-${args.url}`;
        
        if (!toolCallGroups.has(key)) {
          toolCallGroups.set(key, []);
        }
        
        toolCallGroups.get(key)!.push(toolCall);
      } catch (e) {
        // If we can't parse args, treat as individual
        const key = `individual-${toolCall.id}`;
        toolCallGroups.set(key, [toolCall]);
      }
    });
    
    // Now render each group (usually just one item, but could have duplicates)
    return Array.from(toolCallGroups.entries()).map(([groupKey, calls]) => {
      // For each group, find the most "complete" response
      // Priority: success > error > pending
      let primaryCall = calls[0];
      let bestResponse = toolResponses[primaryCall.id];
      let bestState: 'success' | 'error' | 'pending' = 'pending';
      
      for (const call of calls) {
        const response = toolResponses[call.id];
        
        // Skip if no response
        if (!response) continue;
        
        // Check if it's a success response
        if (isSuccessResponse(response, call)) {
          primaryCall = call;
          bestResponse = response;
          bestState = 'success';
          break; // Success is highest priority, stop looking
        }
        
        // Check if it's an error (second priority)
        if (isErrorResponse(response) && bestState === 'pending') {
          primaryCall = call;
          bestResponse = response;
          bestState = 'error';
        }
      }
      
      // Now render using the selected primary call and best response
      return renderToolCallItem(primaryCall, bestResponse, toolCallGroups.size > 1);
    });
  };
  
  const renderToolCallItem = (toolCall: any, response: string | undefined, hasMultiple: boolean) => {
    const toolCallId = toolCall.id;
    const args = JSON.parse(toolCall.function.arguments || '{}');
    const hasError = response && isErrorResponse(response);
    const isPending = isPendingResponse(response, toolCall);
    const isSuccess = response && isSuccessResponse(response, toolCall);
    const index = toolCalls.findIndex(tc => tc.id === toolCallId);

    // Determine title/summary text based on tool type
    let summaryText = '';
    let iconName = 'mdi:api';

    if (toolCall.function?.name === 'http_request') {
      summaryText = `${args.method || 'GET'} ${args.url || ''}`;
      iconName = hasError ? 'mdi:alert-circle' : 
                isPending ? 'mdi:clock-outline' : 
                isSuccess ? 'mdi:check-circle' : 'mdi:api';
    } else if (toolCall.function?.name === 'fetch_logs') {
      summaryText = `Logs: ${args.namespace}/${args.podName}`;
      if (args.containerName) {
        summaryText += `/${args.containerName}`;
      }
      iconName = hasError ? 'mdi:alert-circle' : 
                isPending ? 'mdi:clock-outline' : 
                isSuccess ? 'mdi:check-circle' : 'mdi:text-box-outline';
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
          borderColor: hasError ? 'error.main' : 
                      isPending ? 'info.main' :
                      isSuccess ? 'success.main' : 'divider',
        }}
      >
        <AccordionSummary
          expandIcon={<Icon icon="mdi:chevron-down" />}
          aria-controls={`tool-panel-content-${index}`}
          id={`tool-panel-header-${index}`}
          sx={{
            backgroundColor: hasError ? 'rgba(244, 67, 54, 0.08)' : 
                              isPending ? 'rgba(33, 150, 243, 0.08)' :
                              isSuccess ? 'rgba(76, 175, 80, 0.08)' : 'inherit',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Icon
              icon={iconName}
              style={{
                marginRight: '8px',
                color: hasError ? '#f44336' : 
                       isPending ? '#2196f3' :
                       isSuccess ? '#4caf50' : 'inherit',
              }}
            />
            <Typography
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                color: hasError ? '#f44336' : 
                       isPending ? '#2196f3' :
                       isSuccess ? '#4caf50' : 'inherit',
                fontWeight: hasError || isPending || isSuccess ? 'bold' : 'normal',
              }}
            >
              {summaryText}
              {hasError && ' (Error)'}
              {isPending && ' (Pending)'}
              {isSuccess && !hasError && !isPending && ' (Success)'}
              {hasMultiple && ' (Multiple responses)'}
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
  };

  return (
    <Box mt={2}>
      {renderToolCallGroups()}
    </Box>
  );
};

export default ToolResponseDisplay;
