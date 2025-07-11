import { Alert, Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Theme } from '@mui/material/styles';
import React, { memo } from 'react';
import { Prompt } from './ai/manager';
import ImperativeContentRenderer from './ImperativeContentRenderer';

interface MessageContainerProps {
  prompt: Prompt;
  index: number;
  historyLength: number;
  onYamlDetected: (yaml: string, resourceType: string) => void;
  lastMessageRef: React.RefObject<HTMLDivElement>;
  theme: Theme;
  themeMode: any;
  sidebarColor: any;
  backgroundColor: any;
  contrastText: any;
}

const MessageContainer: React.FC<MessageContainerProps> = memo(
  ({
    prompt,
    index,
    historyLength,
    onYamlDetected,
    lastMessageRef,
    sidebarColor,
    backgroundColor,
    contrastText,
  }) => {
    if (
      prompt.role === 'system' ||
      (prompt.role === 'tool' && typeof prompt.content !== 'string')
    ) {
      return null;
    }

    // Check if this is a content filter error or if the prompt has its own error
    const isContentFilterError = prompt.role === 'assistant' && prompt.contentFilterError;
    const hasError = prompt.error === true;

    if (prompt.content === '' && prompt.role === 'user') return null;
    if (prompt.content === '' && prompt.role === 'assistant') return null;

    return (
      <Box
        ref={historyLength === index + 1 ? lastMessageRef : null}
        sx={{
          mb: 2,
          p: 1.5,
          borderRadius: 1,
          bgcolor: prompt.role === 'user' ? alpha(sidebarColor, 0.75) : backgroundColor,
          border: '1px solid',
          borderColor: isContentFilterError || hasError ? 'error.main' : 'divider',
          color: contrastText,
          ml: prompt.role === 'user' ? 3 : 0,
          mr: prompt.role !== 'user' ? 3 : 0,
        }}
      >
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>
          {prompt.role === 'user' ? 'You' : 'AI Assistant'}
        </Typography>
        <Box sx={{ whiteSpace: 'pre-wrap' }}>
          {prompt.role === 'user' ? (
            prompt.content
          ) : (
            <>
              {isContentFilterError || hasError ? (
                <Alert severity="error" sx={{ mb: 1 }}>
                  {prompt.content}
                  {isContentFilterError && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                      Tip: Focus your question specifically on Kubernetes administration tasks.
                    </Typography>
                  )}
                </Alert>
              ) : (
                <ImperativeContentRenderer
                  content={prompt.content || ''}
                  onYamlDetected={onYamlDetected}
                />
              )}
            </>
          )}
        </Box>
      </Box>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for precise re-render control
    return (
      prevProps.prompt.content === nextProps.prompt.content &&
      prevProps.prompt.role === nextProps.prompt.role &&
      prevProps.prompt.contentFilterError === nextProps.prompt.contentFilterError &&
      prevProps.prompt.error === nextProps.prompt.error &&
      prevProps.index === nextProps.index &&
      prevProps.historyLength === nextProps.historyLength &&
      prevProps.onYamlDetected === nextProps.onYamlDetected &&
      prevProps.themeMode === nextProps.themeMode &&
      prevProps.sidebarColor === nextProps.sidebarColor &&
      prevProps.backgroundColor === nextProps.backgroundColor &&
      prevProps.contrastText === nextProps.contrastText
    );
  }
);

MessageContainer.displayName = 'MessageContainer';

export default MessageContainer;
