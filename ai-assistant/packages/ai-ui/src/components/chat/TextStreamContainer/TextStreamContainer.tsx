/**
 * Chat message stream container component.
 *
 * Renders chat message history with auto-scrolling, content rendering,
 * thinking steps, tool confirmations, and an optional YAML editor dialog.
 *
 * Framework-agnostic: depends only on MUI and ai-ui/ai-common modules.
 * `ContentRendererSlot` and `EditorDialogSlot` props allow the host
 * application to inject platform-specific implementations (e.g. headlamp's
 * ContentRenderer with K8s link resolution, or headlamp's EditorDialog
 * with cluster apply support).
 */

import type { AgentThinkingStep } from '@headlamp-k8s/ai-common/agents/types';
import type { ConversationMessage } from '@headlamp-k8s/ai-common/conversation/types';
import type { ArgumentMap } from '@headlamp-k8s/ai-common/mcp/tools/types';
import { Icon } from '@iconify/react';
import { Alert, Box, CircularProgress, Fab, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AgentThinkingSteps from '../../agent/AgentThinkingSteps/AgentThinkingSteps';
import AgentThinkingBlock from '../../assistant/AgentThinkingBlock/AgentThinkingBlock';
import InlineToolConfirmation from '../../common/InlineToolConfirmation/InlineToolConfirmation';
import {
  DefaultContentRenderer,
  DefaultEditorDialog,
} from '../../defaults/DefaultSlots/DefaultSlots';

/** Props for the EditorDialog slot component. */
export interface EditorDialogSlotProps {
  /** Whether the editor is visible. */
  open: boolean;
  /** Closes the editor without applying further changes. */
  onClose: () => void;
  /** YAML text presented for review or editing. */
  yamlContent: string;
  /** Dialog heading describing the requested operation. */
  title: string;
  /** Kubernetes resource kind associated with the YAML. */
  resourceType?: string;
  /** Whether the requested operation deletes rather than applies a resource. */
  isDelete?: boolean;
  /** Reports a successful editor operation to the host. */
  onSuccess?: (response: unknown) => void;
  /** Reports a failed editor operation and optional resource details. */
  onFailure?: (error: unknown, operationType: string, resourceInfo?: unknown) => void;
}

/** Props for the ContentRenderer slot component. */
export interface ContentRendererSlotProps {
  /** Message content to render. */
  content: string;
  /** Opens or delegates an action for detected Kubernetes YAML. */
  onYamlDetected?: (yaml: string, resourceType: string) => void;
  /** Retries a failed tool call with validated arguments. */
  onRetryTool?: (toolName: string, args: ArgumentMap) => void;
  /** Optional CSS width forwarded to the renderer. */
  promptWidth?: string;
}

/** Props for the TextStreamContainer component. */
export interface TextStreamContainerProps {
  /** Conversation messages displayed in chronological order. */
  history: ConversationMessage[];
  /** Whether an assistant request is currently processing. */
  isLoading: boolean;
  /** Provider-level error shown when no conversation history exists. */
  apiError: string | null;
  /** Receives successful YAML editor operation results. */
  onOperationSuccess?: (response: unknown) => void;
  /** Receives failed YAML editor operation details. */
  onOperationFailure?: (error: unknown, operationType: string, resourceInfo?: unknown) => void;
  /** Delegates YAML actions instead of opening the default editor. */
  onYamlAction?: (yaml: string, title: string, resourceType: string, isDelete: boolean) => void;
  /** Retries a failed tool call from rendered assistant content. */
  onRetryTool?: (toolName: string, args: ArgumentMap) => void;
  /** Optional CSS width forwarded to message content renderers. */
  promptWidth?: string;
  /** Live thinking steps streamed from the agent during processing. */
  agentThinkingSteps?: AgentThinkingStep[];
  /**
   * Component to render message content (markdown, YAML, JSON, etc.).
   * Defaults to a plain-text fallback renderer.
   */
  ContentRendererSlot?: React.ComponentType<ContentRendererSlotProps>;
  /**
   * Component to render the YAML editor dialog.
   * Defaults to a simple textarea-based MUI dialog.
   */
  EditorDialogSlot?: React.ComponentType<EditorDialogSlotProps>;
}

/**
 * Default MUI editor dialog adapter.
 *
 * Wraps the DefaultEditorDialog (textarea-based) to match the
 * EditorDialogSlotProps interface expected by TextStreamContainer.
 */
function DefaultEditorDialogAdapter({
  open,
  onClose,
  yamlContent,
  title,
  onSuccess,
}: EditorDialogSlotProps) {
  return (
    <DefaultEditorDialog
      item={yamlContent}
      open={open}
      onClose={onClose}
      setOpen={() => undefined}
      title={title}
      onSave={content => {
        onSuccess?.({ content });
        onClose();
      }}
    />
  );
}

const TextStreamContainer = React.memo(function TextStreamContainer({
  history,
  isLoading,
  apiError,
  onOperationSuccess,
  onOperationFailure,
  onYamlAction,
  onRetryTool,
  promptWidth,
  agentThinkingSteps,
  ContentRendererSlot = DefaultContentRenderer,
  EditorDialogSlot = DefaultEditorDialogAdapter,
}: TextStreamContainerProps) {
  const { t } = useTranslation();
  const [showEditor, setShowEditor] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [editorTitle, setEditorTitle] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [isDelete, setIsDelete] = useState(false);
  const theme = useTheme();
  // Refs for controlling auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wasNearBottomRef = useRef(true);
  const programmaticScrollRef = useRef(false);
  const programmaticScrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  // State to track if user has scrolled up
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  // Track the last user message count for detecting new user messages
  const lastUserMessageKeyRef = useRef<string>();
  const previousIsLoadingRef = useRef(false);

  const markProgrammaticScroll = useCallback(() => {
    programmaticScrollRef.current = true;
    if (programmaticScrollTimeoutRef.current) {
      clearTimeout(programmaticScrollTimeoutRef.current);
    }
    programmaticScrollTimeoutRef.current = setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 250);
  }, []);

  useEffect(
    () => () => {
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current);
      }
    },
    []
  );

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
    wasNearBottomRef.current = true;
    markProgrammaticScroll();
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Hide the button immediately after clicking it
      setShowScrollButton(false);
    } else if (containerRef.current) {
      // Fallback scrolling method if the ref isn't available
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setShowScrollButton(false);
    }
  }, [markProgrammaticScroll]);

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
          );

          if (userMessageElement instanceof HTMLElement) {
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
              markProgrammaticScroll();
              container.scrollTo({
                top: Math.max(0, targetScrollPosition),
                behavior: 'smooth',
              });
            } else {
              // Show the user message at the top of the viewport
              markProgrammaticScroll();
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
            markProgrammaticScroll();
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
  }, [history, markProgrammaticScroll]);

  // Handle container scroll event
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      if (programmaticScrollRef.current) {
        markProgrammaticScroll();
        return;
      }
      const nearBottom = isNearBottom();
      wasNearBottomRef.current = nearBottom;
      setShowScrollButton(!nearBottom);
    }
  }, [isNearBottom, markProgrammaticScroll]);

  // Scroll to latest message when new messages appear, but only if already near bottom
  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let latestUserIndex = -1;
    for (let index = history.length - 1; index >= 0; index--) {
      if (history[index].role === 'user') {
        latestUserIndex = index;
        break;
      }
    }
    const latestUserMessage = latestUserIndex >= 0 ? history[latestUserIndex] : undefined;
    const latestUserMessageKey = latestUserMessage
      ? latestUserMessage.requestId ?? `${latestUserIndex}:${String(latestUserMessage.content)}`
      : undefined;
    const hasNewUserMessage =
      latestUserMessageKey !== undefined && latestUserMessageKey !== lastUserMessageKeyRef.current;
    lastUserMessageKeyRef.current = latestUserMessageKey;

    if (hasNewUserMessage) {
      // Always scroll to bottom when there's a new user message
      timeouts.push(
        setTimeout(() => {
          scrollToBottom();
        }, 100)
      );
    } else if (wasNearBottomRef.current) {
      // For non-user messages when near bottom, scroll to show at least 60% of new message
      timeouts.push(
        setTimeout(() => {
          scrollToShowNewMessage();
        }, 100)
      );
    } else if (history.length > 0) {
      // If not at bottom, show the scroll button
      setShowScrollButton(true);
    }
    return () => timeouts.forEach(clearTimeout);
  }, [history, scrollToBottom, scrollToShowNewMessage]);

  // Auto-scroll only when loading starts (not when it finishes)
  useEffect(() => {
    const loadingStarted = isLoading && !previousIsLoadingRef.current;
    previousIsLoadingRef.current = isLoading;
    if (loadingStarted && wasNearBottomRef.current) {
      // Small delay to ensure content has rendered
      const timeout = setTimeout(scrollToShowNewMessage, 100);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, scrollToShowNewMessage]);
  const contentFilterErrors = history.some(
    prompt => prompt.role === 'assistant' && prompt.contentFilterError
  );

  const handleYamlDetected = useCallback(
    (yaml: string, detectedResourceType: string) => {
      setEditorContent(yaml);
      setEditorTitle(t('Apply {{resourceType}}', { resourceType: detectedResourceType }));
      setResourceType(detectedResourceType);
      setIsDelete(false);
      setShowEditor(true);
    },
    [t]
  );

  // Memoize the onYamlDetected callback to prevent ContentRenderer from re-rendering
  const memoizedOnYamlDetected = useCallback(
    (yaml: string, resourceType: string) => {
      if (onYamlAction) {
        onYamlAction(yaml, t('Apply {{resourceType}}', { resourceType }), resourceType, false);
      } else {
        handleYamlDetected(yaml, resourceType);
      }
    },
    [onYamlAction, handleYamlDetected, t]
  );

  const renderMessage = useCallback(
    (prompt: ConversationMessage, index: number) => {
      if (
        prompt.role === 'system' ||
        (prompt.role === 'tool' && typeof prompt.content !== 'string') ||
        // Hide tool responses that have a toolCallId — these are intermediate API data
        // that the LLM will analyze and present as a descriptive response instead.
        // Exception: LOGS_BUTTON entries should still render so the user can view/expand logs.
        (prompt.role === 'tool' &&
          prompt.toolCallId &&
          !(typeof prompt.content === 'string' && prompt.content.includes('LOGS_BUTTON:')))
      ) {
        return null;
      }

      // Extract message from tool response if it's JSON with shouldProcessFollowUp
      let displayContent = prompt.content;
      if (prompt.role === 'tool' && typeof prompt.content === 'string') {
        try {
          const parsed: unknown = JSON.parse(prompt.content);
          if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'shouldProcessFollowUp' in parsed &&
            parsed.shouldProcessFollowUp === true &&
            'message' in parsed &&
            typeof parsed.message === 'string'
          ) {
            // Use the message field for display
            displayContent = parsed.message;
          }
        } catch {
          // Not JSON, use original content
        }
      }

      // Check if this is a content filter error or if the prompt has its own error
      const isContentFilterError = prompt.role === 'assistant' && prompt.contentFilterError;
      const hasError = prompt.error === true;
      const isJsonSuccess = prompt.success;

      if (prompt.content === '' && prompt.role === 'user') return null;
      if (
        prompt.content === '' &&
        prompt.role === 'assistant' &&
        !prompt.agentThinkingSteps?.length &&
        !prompt.toolConfirmation
      )
        return null;

      // Determine if this is an agent message with thinking steps
      // Only show the thinking block if there are tool-related steps (not just plain text)
      const hasThinkingSteps =
        prompt.agentThinkingSteps &&
        prompt.agentThinkingSteps.some(
          step =>
            step.type === 'tool-start' || step.type === 'tool-result' || step.type === 'todo-update'
        );
      const thinkingDone = prompt.agentThinkingDone === true;
      // The final answer is the content, but only show it once thinking is done
      // or if it doesn't look like an intermediate message
      const isFinalAnswer = thinkingDone && prompt.content.trim().length > 0;
      // While still thinking, show the thinking block but not the content
      const showContent = !hasThinkingSteps || isFinalAnswer;
      return (
        <Box
          ref={history.length === index + 1 ? lastMessageRef : null}
          data-message-index={index}
          key={prompt.requestId ?? prompt.toolCallId ?? `${prompt.role}-${index}`}
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: 1,
            bgcolor:
              prompt.role === 'user'
                ? alpha(theme.palette.primary.main, 0.08)
                : theme.palette.background.paper,
            border: '1px solid',
            borderColor:
              isContentFilterError || hasError
                ? 'error.main'
                : isJsonSuccess
                ? 'success.main'
                : 'divider',
            color: theme.palette.text.primary,
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
            {prompt.role === 'user' ? t('You') : t('AI Assistant')}
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
            {isJsonSuccess && (
              <Typography
                component="span"
                variant="caption"
                sx={{ display: 'block', color: 'success.main', mb: 0.5, fontWeight: 'bold' }}
              >
                <Icon aria-hidden icon="mdi:check-circle" width="16px" /> {t('Success')}
              </Typography>
            )}
            {prompt.role === 'user' ? (
              displayContent
            ) : (
              <>
                {/* Agent thinking block */}
                {hasThinkingSteps && (
                  <AgentThinkingBlock
                    steps={prompt.agentThinkingSteps ?? []}
                    isActive={!thinkingDone}
                  />
                )}

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
                        {t(
                          'Tip: Focus your question specifically on Kubernetes administration tasks.'
                        )}
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
                        userContext={prompt.toolConfirmation?.userContext}
                      />
                    ) : showContent && prompt.content ? (
                      /* Use ContentRenderer for all assistant content */
                      <ContentRendererSlot
                        content={displayContent || ''}
                        onYamlDetected={memoizedOnYamlDetected}
                        onRetryTool={onRetryTool}
                        promptWidth={promptWidth}
                      />
                    ) : null}
                  </>
                )}
              </>
            )}
          </Box>
        </Box>
      );
    },
    [
      history.length,
      theme.palette,
      memoizedOnYamlDetected,
      ContentRendererSlot,
      onRetryTool,
      promptWidth,
      t,
    ]
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
        role="log"
        aria-live="polite"
        aria-label={t('Conversation messages')}
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
        {apiError && history.length === 0 && (
          <Alert severity="error" sx={{ m: 2 }}>
            {apiError}
          </Alert>
        )}

        {/* Content filter guidance when errors are detected */}
        {contentFilterErrors && (
          <Alert severity="info" sx={{ mb: 2, overflowWrap: 'anywhere' }}>
            <Typography variant="body2">
              {t(
                'Some requests have been blocked by content filters. Please ensure your questions focus only on Kubernetes tasks.'
              )}
            </Typography>
          </Alert>
        )}

        {history.map((prompt, index) => renderMessage(prompt, index))}

        {isLoading &&
          (() => {
            // Hide the loader when an agent thinking block is already showing its own progress
            const last = history[history.length - 1];
            const agentThinking =
              last?.role === 'assistant' &&
              last?.agentThinkingSteps &&
              last.agentThinkingSteps.length > 0 &&
              !last.agentThinkingDone;
            // Also hide when thinking steps are being streamed
            if (agentThinking || (agentThinkingSteps && agentThinkingSteps.length > 0)) return null;
            return (
              <Box
                role="status"
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 2 }}
              >
                <CircularProgress aria-hidden size={24} sx={{ mr: 1 }} />
                <Typography>{t('Processing your request...')}</Typography>
              </Box>
            );
          })()}

        {/* Agent thinking steps (streamed in real time) */}
        {agentThinkingSteps && agentThinkingSteps.length > 0 && (
          <AgentThinkingSteps steps={agentThinkingSteps} isRunning={isLoading} />
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
          aria-label={t('scroll to bottom')}
        >
          <Icon aria-hidden icon="mdi:chevron-down" width="20px" />
        </Fab>
      )}

      {/* Editor Dialog */}
      <EditorDialogSlot
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
