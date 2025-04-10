import { Icon } from '@iconify/react';
import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import React, { useState } from 'react';
import { Prompt } from './ai/manager';

// Function to render Kubernetes resource links in the format $$$LINK:kind:namespace:name$$$
const renderKubeLinks = (text: string) => {
  if (!text) return '';

  const regex = /\$\$\$LINK:([^:]+):([^:]+):([^$]+)\$\$\$/g;
  const parts = [];
  let lastIndex = 0;

  // Create a copy of the regex to use in the loop
  const regexCopy = new RegExp(regex);

  let match;
  while ((match = regexCopy.exec(text)) !== null) {
    // Add text before link
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${match.index}`}>{text.substring(lastIndex, match.index)}</span>);
    }

    const [, kind, namespace, name] = match;

    // Add resource link
    parts.push(
      <Box
        component="span"
        key={`link-${match.index}`}
        sx={{
          display: 'inline-flex',
          bgcolor: 'action.hover',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          px: 0.5,
          py: 0.25,
          mx: 0.5,
          alignItems: 'center',
        }}
      >
        <Icon icon={`mdi:kubernetes`} width="16" height="16" style={{ marginRight: '4px' }} />
        <Link routeName={kind.toLowerCase()} params={{ namespace, name }}>
          {name}
        </Link>
      </Box>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`text-end`}>{text.substring(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : text;
};

// Helper function to format code or JSON content
const formatContent = (content: string, isExpanded: boolean, toggleExpand: () => void) => {
  const contentIsTrimmed = content.length > 200 && !isExpanded;
  const displayContent = contentIsTrimmed ? content.substring(0, 200) + '...' : content;
  console.log('Content:', content);
  try {
    // Check if the content is valid JSON
    const parsedJson = JSON.parse(content);
    const displayJson = contentIsTrimmed
      ? JSON.stringify(parsedJson, null, 2).substring(0, 200) + '...'
      : JSON.stringify(parsedJson, null, 2);

    return (
      <>
        <Box
          component="pre"
          sx={{
            padding: 1,
            borderRadius: 1,
            fontSize: '0.75rem',
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {displayJson}
        </Box>
        {content.length > 200 && (
          <Button
            size="small"
            onClick={toggleExpand}
            sx={{ mt: 1, textTransform: 'none' }}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </Button>
        )}
      </>
    );
  } catch (e) {
    // If not valid JSON, return the content normally
    return (
      <>
        <div>{renderKubeLinks(displayContent)}</div>
        {content.length > 200 && (
          <Button
            size="small"
            onClick={toggleExpand}
            sx={{ mt: 1, textTransform: 'none' }}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </Button>
        )}
      </>
    );
  }
};

export default function TextStreamContainer({
  history,
  isLoading,
  apiError,
}: {
  history: Prompt[];
  isLoading: boolean;
  apiError: string | null;
}) {
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  const toggleExpand = (index: number) => {
    setExpandedTools(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <Box>
      {history.map((prompt, index) => (
        <Box
          key={index}
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 1,
            bgcolor: prompt.role === 'user' ? 'primary.light' : 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>
            {prompt.role === 'user'
              ? 'You'
              : prompt.role === 'tool'
              ? 'Tool Response'
              : 'AI Assistant'}
          </Typography>

          <Box sx={{ whiteSpace: 'pre-wrap' }}>
          {prompt.role === 'tool'
  ? formatContent(
      prompt.content || 'No response from tool.',
      !!expandedTools[index],
      () => toggleExpand(index)
    )
  : renderKubeLinks(prompt.content || 'No content available.')}

            {prompt.toolCalls && (
              <Box sx={{ mt: 1 }}>
                {prompt.toolCalls.map((call, idx) => {
                  const args = JSON.parse(call.function.arguments);
                  return (
                    <Box
                      key={idx}
                      sx={{
                        bgcolor: 'info.light',
                        color: 'info.contrastText',
                        p: 1,
                        borderRadius: 1,
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Icon icon="mdi:api" style={{ marginRight: '8px' }} />
                      <Typography variant="body2" sx={{
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        overflowWrap: 'break-word'
                      }}>
                        Fetching: {args.method} {args.url}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
      ))}

      {isLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} sx={{ mr: 1 }} />
          <Typography>Processing your request...</Typography>
        </Box>
      )}

      {apiError && (
        <Box
          sx={{
            p: 2,
            bgcolor: 'error.light',
            color: 'error.contrastText',
            borderRadius: 1,
            mt: 2,
          }}
        >
          <Typography variant="body2">{apiError}</Typography>
        </Box>
      )}
    </Box>
  );
}
