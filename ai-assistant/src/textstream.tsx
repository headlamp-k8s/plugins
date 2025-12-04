import { Icon } from '@iconify/react';
import { Alert, Box, CircularProgress, Fab, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Prompt } from './ai/manager';
import { InlineToolConfirmation } from './components';
import ContentRenderer from './ContentRenderer';
import EditorDialog from './editordialog';

const TextStreamContainer = React.memo(function TextStreamContainer({
  history,
  isLoading,
  apiError,
  onOperationSuccess,
  onOperationFailure,
  onYamlAction,
  onRetryTool,
}: {
  history: Prompt[];
  isLoading: boolean;
  apiError: string | null;
  onOperationSuccess?: (response: any) => void;
  onOperationFailure?: (error: any, operationType: string, resourceInfo?: any) => void;
  onYamlAction?: (yaml: string, title: string, resourceType: string, isDelete: boolean) => void;
  onRetryTool?: (toolName: string, args: Record<string, any>) => void;
  promptWidth?: string;
}) {
  const [showEditor, setShowEditor] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [editorTitle, setEditorTitle] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [isDelete, setIsDelete] = useState(false);
  const theme = useTheme();
  // Track if content filter errors were detected
  const [contentFilterErrors, setContentFilterErrors] = useState<boolean>(false);
  // Refs for controlling auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // State to track if user has scrolled up
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  // Track the last user message count for detecting new user messages
  const lastUserMessageCountRef = useRef<number>(0);

  // Check if user is near bottom for auto-scrolling
  const isNearBottom = useCallback(() => {
    if (!containerRef.current) return true;

    const container = containerRef.current;
    const threshold = 100; // pixels from bottom to trigger auto-scroll
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    return distanceFromBottom <= threshold;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Hide the button immediately after clicking it
      setShowScrollButton(false);
    } else if (containerRef.current) {
      // Fallback scrolling method if the ref isn't available
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  const scrollToShowNewMessage = useCallback(() => {
    if (containerRef.current && history.length > 0) {
      const container = containerRef.current;

      // Find the most recent user message
      let lastUserMessageIndex = -1;
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'user') {
          lastUserMessageIndex = i;
          break;
        }
      }

      if (lastUserMessageIndex >= 0) {
        // Count non-user messages after the last user message
        const nonUserMessagesAfterUser = history.length - 1 - lastUserMessageIndex;

        if (nonUserMessagesAfterUser === 1) {
          // Only one non-user message after user - show the user message
          const messageElements = container.querySelectorAll('[data-message-index]');
          const userMessageElement = Array.from(messageElements).find(
            el => el.getAttribute('data-message-index') === lastUserMessageIndex.toString()
          ) as HTMLElement;

          if (userMessageElement) {
            // Get the position of the user message relative to the container
            const messageRect = userMessageElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const messageTop = messageRect.top - containerRect.top + container.scrollTop;

            // Check if the user message is larger than the viewport
            const containerHeight = containerRect.height;
            const messageHeight = messageRect.height;

            if (messageHeight > containerHeight) {
              // If user message is larger than viewport, show the bottom of it
              const targetScrollPosition = messageTop + messageHeight - containerHeight;
              container.scrollTo({
                top: Math.max(0, targetScrollPosition),
                behavior: 'smooth',
              });
            } else {
              // Show the user message at the top of the viewport
              container.scrollTo({
                top: Math.max(0, messageTop),
                behavior: 'smooth',
              });
            }
          }
        } else {
          // Multiple non-user messages after user - show half of the last message
          if (lastMessageRef.current) {
            const lastMessageElement = lastMessageRef.current;
            const messageRect = lastMessageElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const messageTop = messageRect.top - containerRect.top + container.scrollTop;

            // Scroll to show half of the last message
            container.scrollTo({
              top: messageTop,
              behavior: 'smooth',
            });
          }
        }
      } else {
        // Fallback: scroll to bottom if no user message found
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [history]);

  // const scrollToLastMessage = useCallback(() => {
  //   if (!lastMessageRef.current) {
  //     return;
  //   }

  //   lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // }, []);

  // Handle container scroll event
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const nearBottom = isNearBottom();
      setShowScrollButton(!nearBottom);
    }
  }, [isNearBottom]);

  // Scroll to latest message when new messages appear, but only if already near bottom
  useEffect(() => {
    // Count current user messages
    const currentUserMessageCount = history.filter(prompt => prompt.role === 'user').length;

    // Check if there's a new user message
    const hasNewUserMessage = currentUserMessageCount > lastUserMessageCountRef.current;

    if (hasNewUserMessage) {
      // Always scroll to bottom when there's a new user message
      setTimeout(() => {
        scrollToBottom();
      }, 100);
      // Update the ref with current count
      lastUserMessageCountRef.current = currentUserMessageCount;
    } else if (isNearBottom()) {
      // For non-user messages when near bottom, scroll to show at least 60% of new message
      setTimeout(() => {
        scrollToShowNewMessage();
      }, 100);
    } else if (history.length > 0) {
      // If not at bottom, show the scroll button
      setShowScrollButton(true);
      scrollToShowNewMessage();
    }
  }, [history, isNearBottom, scrollToBottom, scrollToShowNewMessage]);

  // Auto-scroll only when loading starts (not when it finishes)
  useEffect(() => {
    if (isLoading && isNearBottom()) {
      // Small delay to ensure content has rendered
      setTimeout(scrollToShowNewMessage, 100);
    }
  }, [isLoading, isNearBottom, scrollToShowNewMessage]);

  useEffect(() => {
    // Collect tool responses
    const responseMap: Record<string, string> = {};
    history.forEach(prompt => {
      if (prompt.role === 'tool' && prompt.toolCallId) {
        responseMap[prompt.toolCallId] = prompt.content;
      }

      // Check for content filter errors
      if (prompt.role === 'assistant' && prompt.contentFilterError) {
        setContentFilterErrors(true);
      }
    });
  }, [history]);

  const handleYamlDetected = useCallback((yaml: string, resourceType: string) => {
    // Since we're removing the Delete button, we'll set isDelete to false always
    setEditorContent(yaml);
    setEditorTitle(`Apply ${resourceType}`);
    setResourceType(resourceType);
    setIsDelete(false); // Always false since we don't show delete button
    setShowEditor(true);
  }, []);

  // Memoize the onYamlDetected callback to prevent ContentRenderer from re-rendering
  const memoizedOnYamlDetected = useCallback(
    (yaml: string, resourceType: string) => {
      if (onYamlAction) {
        onYamlAction(yaml, `Apply ${resourceType}`, resourceType, false);
      } else {
        handleYamlDetected(yaml, resourceType);
      }
    },
    [onYamlAction, handleYamlDetected]
  );

  const renderMessage = useCallback(
    (prompt: Prompt, index: number) => {
      if (
        prompt.role === 'system' ||
        (prompt.role === 'tool' && typeof prompt.content !== 'string')
      ) {
        return null;
      }

      // Extract message from tool response if it's JSON with shouldProcessFollowUp
      let displayContent = prompt.content;
      if (prompt.role === 'tool' && typeof prompt.content === 'string') {
        try {
          const parsed = JSON.parse(prompt.content);
          if (parsed.shouldProcessFollowUp && parsed.message) {
            // Use the message field for display
            displayContent = parsed.message;
          }
        } catch (e) {
          // Not JSON, use original content
        }
      }

      // Check if this is a content filter error or if the prompt has its own error
      const isContentFilterError = prompt.role === 'assistant' && prompt.contentFilterError;
      const hasError = prompt.error === true;
      const isJsonError = prompt.error;
      const isJsonSuccess = prompt.success;

      if (prompt.content === '' && prompt.role === 'user') return null;
      if (displayContent === '' && prompt.role === 'assistant' && !prompt.toolConfirmation)
        return null;
      return (
        <Box
          ref={history.length === index + 1 ? lastMessageRef : null}
          data-message-index={index}
          key={index}
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 1,
            bgcolor:
              prompt.role === 'user'
                ? alpha(theme.palette.sidebar.selectedBackground, 0.75)
                : theme.palette.background.paper,
            border: '1px solid',
            borderColor:
              isContentFilterError || hasError || isJsonError
                ? 'error.main'
                : isJsonSuccess
                ? 'success.main'
                : 'divider',
            color: theme.palette.getContrastText(
              prompt.role === 'user'
                ? alpha(theme.palette.sidebar.selectedBackground, 0.75)
                : theme.palette.background.paper
            ),
            ml: prompt.role === 'user' ? 3 : 0,
            mr: prompt.role !== 'user' ? 3 : 0,
            // Add width constraints to prevent width expansion while allowing content wrapping
            maxWidth: '100%',
            minWidth: 0, // Allow shrinking
            minHeight: 'auto', // Allow natural height expansion
            height: 'auto', // Allow natural height
            overflowWrap: 'break-word',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            hyphens: 'auto',
          }}
        >
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 'bold' }}>
            {prompt.role === 'user' ? 'You' : 'AI Assistant'}
          </Typography>
          <Box
            sx={{
              maxWidth: '100%',
              minWidth: 0,
              width: '100%', // Ensure full width usage
              overflowWrap: 'break-word',
              wordWrap: 'break-word',
              wordBreak: 'break-word',
              overflowX: 'auto', // Add horizontal scroll as fallback
              overflowY: 'visible', // Allow vertical expansion
            }}
          >
            {prompt.role === 'user' ? (
              displayContent
            ) : (
              <>
                {isContentFilterError || hasError ? (
                  <Alert
                    severity="error"
                    sx={{
                      mb: 1,
                      overflowWrap: 'anywhere',
                      overflowX: 'auto',
                      maxWidth: '100%',
                      wordBreak: 'break-word',
                    }}
                  >
                    {displayContent}
                    {isContentFilterError && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                        Tip: Focus your question specifically on Kubernetes administration tasks.
                      </Typography>
                    )}
                  </Alert>
                ) : (
                  <>
                    {/* Check if this is a tool confirmation message */}
                    {prompt.toolConfirmation ? (
                      <InlineToolConfirmation
                        toolCalls={prompt.toolConfirmation.tools}
                        onApprove={prompt.toolConfirmation.onApprove}
                        onDeny={prompt.toolConfirmation.onDeny}
                        loading={prompt.toolConfirmation.loading}
                        // @ts-ignore
                        userContext={prompt.toolConfirmation?.userContext}
                        compact={false}
                      />
                    ) : (
                      /* Use ContentRenderer for all assistant content */
                      <ContentRenderer
                        content={displayContent || ''}
                        onYamlDetected={memoizedOnYamlDetected}
                        onRetryTool={onRetryTool}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </Box>
        </Box>
      );
    },
    [history.length, theme.palette, memoizedOnYamlDetected]
  );

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        maxWidth: '100%',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <Box
        ref={containerRef}
        onScroll={handleScroll}
        sx={{
          maxHeight: '100%',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'auto', // Allow horizontal scrolling when needed
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '100%',
          minWidth: 0,
        }}
      >
        {/* Content filter guidance when errors are detected */}
        {contentFilterErrors && (
          <Alert severity="info" sx={{ mb: 2, overflowWrap: 'anywhere' }}>
            <Typography variant="body2">
              Some requests have been blocked by content filters. Please ensure your questions focus
              only on Kubernetes tasks.
            </Typography>
          </Alert>
        )}

        {history.map((prompt, index) => renderMessage(prompt, index))}

        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography>Processing your request...</Typography>
          </Box>
        )}

        {/* This is an invisible element that we'll scroll to */}
        <div ref={messagesEndRef} />
      </Box>

      {showScrollButton && (
        <Fab
          color="primary"
          size="small"
          onClick={scrollToBottom}
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            zIndex: 2,
          }}
          aria-label="scroll to bottom"
        >
          <Icon icon="mdi:chevron-down" width="20px" />
        </Fab>
      )}

      {/* Show global API error only when there's no history or specific prompt errors */}
      {apiError && history.length === 0 && (
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

      {/* Editor Dialog */}
      <EditorDialog
        open={showEditor}
        onClose={() => setShowEditor(false)}
        yamlContent={editorContent}
        title={editorTitle}
        resourceType={resourceType}
        isDelete={isDelete}
        onSuccess={response => {
          if (onOperationSuccess) {
            onOperationSuccess(response);
          }
        }}
        onFailure={(error, operationType, resourceInfo) => {
          if (onOperationFailure) {
            onOperationFailure(error, operationType, resourceInfo);
          }
        }}
      />
    </Box>
  );
});

export default TextStreamContainer;
