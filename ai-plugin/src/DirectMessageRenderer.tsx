import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Theme } from '@mui/material/styles';
import { createRoot, Root } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { Prompt } from './ai/manager';
import ImperativeContentRenderer from './ImperativeContentRenderer';

interface DirectMessageRendererProps {
  history: Prompt[];
  onYamlDetected: (yaml: string, resourceType: string) => void;
  theme: Theme;
  onLastMessageRef?: (element: HTMLDivElement | null) => void;
  themeColors?: {
    sidebarColor: string;
    backgroundColor: string;
    contrastText: string;
  };
}

/**
 * DirectMessageRenderer completely bypasses React's reconciliation for message rendering.
 * Each message is rendered imperatively in its own React root to prevent any re-renders
 * from affecting YAML editor state.
 */
const DirectMessageRenderer: React.FC<DirectMessageRendererProps> = ({
  history,
  onYamlDetected,
  theme,
  onLastMessageRef,
  themeColors
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const messageRootsRef = useRef<Map<string, { root: Root; element: HTMLDivElement }>>(new Map());
  const lastHistoryRef = useRef<Prompt[]>([]);

  // Generate stable message ID based on content and position
  const getMessageId = useCallback((prompt: Prompt, index: number) => {
    const content = typeof prompt.content === 'string' ? prompt.content : '';
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    // Include role and index to make ID more unique
    return `${prompt.role}-${Math.abs(hash).toString(36)}-${index}`;
  }, []);

  // Clean up all message roots
  const cleanupAllRoots = useCallback(() => {
    messageRootsRef.current.forEach(({ root }) => {
      root.unmount();
    });
    messageRootsRef.current.clear();
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
  }, []);

  // Render a single message imperatively
  const renderMessageImperatively = useCallback((prompt: Prompt, index: number) => {
    if (!containerRef.current) {
      // Retry in next tick if container isn't ready
      setTimeout(() => {
        if (containerRef.current) {
          renderMessageImperatively(prompt, index);
        }
      }, 0);
      return;
    }

    const messageId = getMessageId(prompt, index);

    // Skip if already rendered
    if (messageRootsRef.current.has(messageId)) {
      return;
    }

    // Skip system messages and non-string tool messages
    if (
      prompt.role === 'system' ||
      (prompt.role === 'tool' && typeof prompt.content !== 'string')
    ) {
      return;
    }

    // Create message container element
    const messageElement = document.createElement('div');
    messageElement.style.marginBottom = '16px';

    // Set ref for last message
    if (index === history.length - 1 && onLastMessageRef) {
      onLastMessageRef(messageElement);
    }

    // Create React root for this message
    const root = createRoot(messageElement);

    // Render message content
    const isUser = prompt.role === 'user';
    const isAssistant = prompt.role === 'assistant';
    const isError = prompt.contentFilterError || (isAssistant && prompt.content?.includes('filtered'));
    const isContentFilterError = isError && prompt.content?.includes('content filter');

    root.render(
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 1,
            bgcolor: isUser
              ? alpha(themeColors?.sidebarColor || theme.palette.primary.main, 0.75)
              : themeColors?.backgroundColor || theme.palette.background.paper,
            border: '1px solid',
            borderColor: isError ? 'error.main' : 'divider',
            color: themeColors?.contrastText || theme.palette.text.primary,
            ml: isUser ? 3 : 0,
            mr: !isUser ? 3 : 0,
          }}
        >
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>
            {isUser ? 'You' : 'AI Assistant'}
          </Typography>
          <Box sx={{ whiteSpace: 'pre-wrap' }}>
            {isUser ? (
              prompt.content
            ) : (
              <>
                {isError ? (
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
      </ThemeProvider>
    );

    // Store the root and append to container
    messageRootsRef.current.set(messageId, { root, element: messageElement });
    containerRef.current.appendChild(messageElement);
  }, [getMessageId, history.length, onLastMessageRef, theme, themeColors, onYamlDetected]);

  // Effect to render messages
  useEffect(() => {
    const currentHistory = history;
    const lastHistory = lastHistoryRef.current;

    // Check if history has actually changed (content-wise)
    const historyChanged = 
      currentHistory.length !== lastHistory.length ||
      currentHistory.some((prompt, index) => {
        const lastPrompt = lastHistory[index];
        return !lastPrompt || 
               prompt.content !== lastPrompt.content || 
               prompt.role !== lastPrompt.role ||
               prompt.isDisplayOnly !== lastPrompt.isDisplayOnly;
      });

    if (!historyChanged) {
      return; // No changes, don't re-render
    }

    if (currentHistory.length === 0) {
      // No messages, clean up everything
      cleanupAllRoots();
      lastHistoryRef.current = [];
      return;
    }

    // Clear all existing messages and re-render everything
    // This ensures we handle cases where greeting messages are added/removed
    cleanupAllRoots();
    
    // Use a small delay to ensure the container is ready
    requestAnimationFrame(() => {
      // Render all current messages
      currentHistory.forEach((prompt, index) => {
        renderMessageImperatively(prompt, index);
      });
    });

    // Update the stored history reference
    lastHistoryRef.current = [...currentHistory];
  }, [history, renderMessageImperatively, cleanupAllRoots]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAllRoots();
    };
  }, [cleanupAllRoots]);

  return <div ref={containerRef} style={{ width: '100%' }} />;
};

export default React.memo(DirectMessageRenderer, (prevProps, nextProps) => {
  // Only prevent re-render if history length and content are exactly the same
  return (
    prevProps.history.length === nextProps.history.length &&
    prevProps.history === nextProps.history &&
    prevProps.theme === nextProps.theme &&
    prevProps.themeColors === nextProps.themeColors &&
    prevProps.onYamlDetected === nextProps.onYamlDetected
  );
});
