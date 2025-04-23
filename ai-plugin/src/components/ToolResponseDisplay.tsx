import { Icon } from '@iconify/react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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

  return (
    <Box mt={2}>
      <Typography variant="subtitle2" gutterBottom>
        API Requests:
      </Typography>
      {toolCalls.map((toolCall, index) => {
        const toolCallId = toolCall.id;
        const response = toolResponses[toolCallId] || 'Waiting for response...';
        const args = JSON.parse(toolCall.function.arguments || '{}');

        let formattedRequest = '';
        try {
          formattedRequest = `${args.method || 'GET'} ${args.url || ''}`;
          if (args.body) {
            formattedRequest += `\nBody: ${formatJson(args.body)}`;
          }
        } catch (e) {
          formattedRequest = 'Error formatting request';
        }

        return (
          <Accordion
            key={toolCallId}
            expanded={!!expandedTools[index]}
            onChange={() => toggleExpand(index)}
            sx={{
              mb: 1,
              '&.MuiPaper-root': { backgroundColor: 'background.paper' },
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <AccordionSummary
              expandIcon={<Icon icon="mdi:chevron-down" />}
              aria-controls={`tool-panel-content-${index}`}
              id={`tool-panel-header-${index}`}
            >
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                {formattedRequest.split('\n')[0]}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Paper
                variant="outlined"
                sx={{
                  p: 1,
                  backgroundColor: 'background.default',
                  maxHeight: '300px',
                  overflow: 'auto',
                }}
              >
                <Typography variant="caption" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Response:
                </Typography>
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
                  {isYamlContent(response) ? response : formatJson(response)}
                </Typography>
              </Paper>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default ToolResponseDisplay;
