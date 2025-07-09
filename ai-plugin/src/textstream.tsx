import { Icon } from '@iconify/react';
import { Alert, Box, CircularProgress, Fab, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useEffect, useRef, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prompt } from './ai/manager';
import YamlDisplay from './components/YamlDisplay';
import EditorDialog from './editordialog';
import { parseKubernetesYAML } from './utils/SampleYamlLibrary';
import YamlContentProcessor from './YamlContentProcessor';

// Helper function to detect resource list results
const isResourceListResult = (content: string): boolean => {
  if (!content) return false;

  // Check for common resource list result patterns
  const foundItemsPattern = /Found \d+ items across \d+ namespaces/;

  return (
    content.includes('Found 0 items') ||
    foundItemsPattern.test(content) ||
    (content.includes('No resources found') && !content.includes('```yaml')) ||
    // Other resource list patterns can be added here
    (content.includes('NAME') &&
      content.includes('NAMESPACE') &&
      content.includes('AGE') &&
      !content.includes('```'))
  );
};

// Markdown renderer component with proper width constraints
const MarkdownRenderer = ({
  content,
  onYamlDetected,
}: {
  content: string;
  onYamlDetected?: (yaml: string, resourceType: string) => void;
}) => {
  return (
    <Box sx={{ width: '100%', overflowWrap: 'break-word', wordWrap: 'break-word' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Override h1 rendering
          h1: ({ ...props }) => (
            <Typography variant="h4" gutterBottom sx={{ overflowWrap: 'break-word' }} {...props} />
          ),
          // Override h2 rendering
          h2: ({ ...props }) => (
            <Typography variant="h5" gutterBottom sx={{ overflowWrap: 'break-word' }} {...props} />
          ),
          // Override h3 rendering
          h3: ({ ...props }) => (
            <Typography variant="h6" gutterBottom sx={{ overflowWrap: 'break-word' }} {...props} />
          ),
          // Override paragraph rendering
          p: ({ ...props }) => (
            <Typography variant="body1" paragraph sx={{ overflowWrap: 'break-word' }} {...props} />
          ),
          // Style for code blocks
          code: ({ className, children, ...props }: any) => {
            // Check if this is a YAML code block
            const isYamlBlock =
              !props.inline &&
              (className === 'language-yaml' ||
                className === 'language-yml' ||
                (typeof children === 'string' &&
                  children.includes('apiVersion:') &&
                  children.includes('kind:')));

            if (isYamlBlock && onYamlDetected && typeof children === 'string') {
              // Try to parse as Kubernetes YAML
              const parsed = parseKubernetesYAML(children);
              if (parsed.isValid) {
                return (
                  <YamlDisplay
                    yaml={children}
                    title={parsed.resourceType}
                    onOpenInEditor={onYamlDetected}
                  />
                );
              }
            }

            // Match language if specified
            return !props.inline ? (
              <Box
                component="pre"
                sx={{
                  backgroundColor: theme => theme.palette.grey[100],
                  color: theme => theme.palette.grey[900],
                  padding: 2,
                  borderRadius: 1,
                  overflowX: 'auto',
                  '& code': {
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                  },
                }}
              >
                <Box component="code" className={className} {...props}>
                  {children}
                </Box>
              </Box>
            ) : (
              <Box
                component="code"
                sx={{
                  backgroundColor: theme => theme.palette.grey[100],
                  color: theme => theme.palette.grey[900],
                  padding: '0.1em 0.3em',
                  borderRadius: '0.3em',
                  fontSize: '85%',
                  wordWrap: 'break-word',
                }}
                className={className}
                {...props}
              >
                {children}
              </Box>
            );
          },
          // Style for tables to enable horizontal scrolling when needed
          table: ({ ...props }) => (
            <Box sx={{ overflowX: 'auto', width: '100%', mb: 2 }}>
              <Box
                component="table"
                sx={{ minWidth: '400px', borderCollapse: 'collapse' }}
                {...props}
              />
            </Box>
          ),
          // Style for table headers
          th: ({ ...props }) => (
            <Box
              component="th"
              sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                padding: '8px 16px',
                textAlign: 'left',
                fontWeight: 'bold',
              }}
              {...props}
            />
          ),
          // Style for table cells
          td: ({ ...props }) => (
            <Box
              component="td"
              sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                padding: '8px 16px',
                textAlign: 'left',
              }}
              {...props}
            />
          ),
          // Style for lists
          ul: ({ ...props }) => (
            <Box component="ul" sx={{ pl: 2, mb: 2, overflowWrap: 'break-word' }} {...props} />
          ),
          ol: ({ ...props }) => (
            <Box component="ol" sx={{ pl: 2, mb: 2, overflowWrap: 'break-word' }} {...props} />
          ),
          li: ({ ...props }) => (
            <Box component="li" sx={{ mb: 1, overflowWrap: 'break-word' }} {...props} />
          ),
          // Style for links
          a: ({ ...props }) => (
            <Box
              component="a"
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
                overflowWrap: 'break-word',
                wordBreak: 'break-all',
              }}
              {...props}
            />
          ),
          // Style for blockquotes
          blockquote: ({ ...props }) => (
            <Box
              component="blockquote"
              sx={{
                borderLeft: '4px solid',
                borderColor: 'divider',
                pl: 2,
                my: 2,
                color: 'text.secondary',
                overflowWrap: 'break-word',
              }}
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default function TextStreamContainer({
  history,
  isLoading,
  apiError,
  onOperationSuccess,
  onYamlAction,
}: {
  history: Prompt[];
  isLoading: boolean;
  apiError: string | null;
  onOperationSuccess?: (response: any) => void;
  onYamlAction?: (yaml: string, title: string, resourceType: string, isDelete: boolean) => void;
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

  const scrollToLastMessage = useCallback(() => {
    if (!lastMessageRef.current) {
      return;
    }

    lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Handle container scroll event
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const nearBottom = isNearBottom();
      setShowScrollButton(!nearBottom);
    }
  }, [isNearBottom]);

  // Scroll to latest message when new messages appear, but only if already near bottom
  useEffect(() => {
    // Small delay to ensure DOM is updated before scrolling
    setTimeout(() => {
      if (isNearBottom() || isLoading) {
        scrollToBottom();
      } else if (history.length > 0) {
        // If not at bottom, show the scroll button
        setShowScrollButton(true);
      }
    }, 100);
  }, [history, isLoading, isNearBottom, scrollToBottom]);

  // Additional effect for when loading finishes, to ensure we scroll to the final content
  useEffect(() => {
    if (!isLoading && history.length > 0) {
      // Small delay to ensure content has rendered
      setTimeout(scrollToLastMessage, 200);
    }
  }, [isLoading, history.length, scrollToLastMessage]);

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

  const renderMessage = useCallback((prompt: Prompt, index: number) => {
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
        ref={history.length === index + 1 ? lastMessageRef : null}
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
          borderColor: isContentFilterError || hasError ? 'error.main' : 'divider',
          color: theme.palette.getContrastText(
            prompt.role === 'user'
              ? alpha(theme.palette.sidebar.selectedBackground, 0.75)
              : theme.palette.background.paper
          ),
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
                <>
                  {/* Determine if the content is YAML-heavy or regular markdown */}
                  {(() => {
                    const content = prompt.content || '';

                    // First check if it's a resource list result
                    if (isResourceListResult(content)) {
                      // For resource lists, always use Markdown renderer
                      return (
                        <MarkdownRenderer
                          content={content}
                          onYamlDetected={(yaml, resourceType) => {
                            if (onYamlAction) {
                              onYamlAction(yaml, `Apply ${resourceType}`, resourceType, false);
                            } else {
                              handleYamlDetected(yaml, resourceType);
                            }
                          }}
                        />
                      );
                    }

                    // More precise YAML detection to avoid false positives
                    const containsYamlBlocks =
                      // Explicit code blocks
                      content.includes('```yaml') ||
                      content.includes('```yml') ||
                      // Structured YAML with multiple Kubernetes identifiers (more precise)
                      (content.includes('apiVersion:') &&
                        content.includes('kind:') &&
                        content.includes('metadata:') &&
                        // Make sure it has proper YAML structure with indentation
                        (content.match(/^\s*apiVersion:/m) || content.match(/^\s*kind:/m)));

                    if (containsYamlBlocks) {
                      // For content with actual YAML blocks, use YamlContentProcessor
                      return (
                        <YamlContentProcessor
                          content={content}
                          onYamlDetected={(yaml, resourceType) => {
                            if (onYamlAction) {
                              // Simply pass the YAML to the parent handler
                              onYamlAction(yaml, `Apply ${resourceType}`, resourceType, false);
                            } else {
                              handleYamlDetected(yaml, resourceType);
                            }
                          }}
                        />
                      );
                    } else {
                      // For regular content, render as Markdown
                      return (
                        <MarkdownRenderer
                          content={content}
                          onYamlDetected={(yaml, resourceType) => {
                            if (onYamlAction) {
                              onYamlAction(yaml, `Apply ${resourceType}`, resourceType, false);
                            } else {
                              handleYamlDetected(yaml, resourceType);
                            }
                          }}
                        />
                      );
                    }
                  })()}
                </>
              )}
            </>
          )}
        </Box>
      </Box>
    );
  }, [history.length, theme.palette, onYamlAction, handleYamlDetected]);

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <Box
        ref={containerRef}
        onScroll={handleScroll}
        sx={{
          maxHeight: '100%',
          height: '100%',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Content filter guidance when errors are detected */}
        {contentFilterErrors && (
          <Alert severity="info" sx={{ mb: 2 }}>
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
      />
    </Box>
  );
}
