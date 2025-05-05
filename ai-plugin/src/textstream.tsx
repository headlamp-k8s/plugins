import { Icon } from '@iconify/react';
import { Alert, Box, Button, CircularProgress, Divider, Typography } from '@mui/material';
import React from 'react';
import { useEffect, useState } from 'react';
import ToolResponseDisplay from './components/ToolResponseDisplay';
import YamlLibraryDialog from './components/YamlLibraryDialog';
import EditorDialog from './editordialog';
import { parseKubernetesYAML } from './utils/SampleYamlLibrary';
import YamlContentProcessor from './YamlContentProcessor';
import { Prompt } from './ai/manager';
import { useTheme } from '@mui/material';

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
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [showEditor, setShowEditor] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [editorTitle, setEditorTitle] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [isDelete, setIsDelete] = useState(false);
  const [showYamlLibrary, setShowYamlLibrary] = useState(false);

  // Store tool responses by their toolCallId
  const [toolResponses, setToolResponses] = useState<Record<string, string>>({});
  const [detectedYamls, setDetectedYamls] = useState<
    Record<string, { yaml: string; resourceType: string; name: string }>
  >({});
  const theme = useTheme();
  // Track pending tool calls
  const [pendingToolCalls, setPendingToolCalls] = useState<Set<string>>(new Set());
  
  // Track completed operations to update the status of non-GET operations
  const [completedOperations, setCompletedOperations] = useState<Set<string>>(new Set());

  // Track if content filter errors were detected
  const [contentFilterErrors, setContentFilterErrors] = useState<boolean>(false);
  useEffect(() => {
    // Collect tool responses
    const responseMap: Record<string, string> = {};
    history.forEach(prompt => {
      if (prompt.role === 'tool' && prompt.toolCallId) {
        responseMap[prompt.toolCallId] = prompt.content;
        // Any tool with a response is no longer pending
        setPendingToolCalls(prev => {
          const updated = new Set(prev);
          updated.delete(prompt.toolCallId);
          return updated;
        });
      }

      // Track pending tool calls from assistant messages
      if (prompt.role === 'assistant' && prompt.toolCalls) {
        // Add any new tool calls to pending set
        prompt.toolCalls.forEach(toolCall => {
          setPendingToolCalls(prev => {
            const updated = new Set(prev);
            // Only add if we don't already have a response
            if (!responseMap[toolCall.id]) {
              updated.add(toolCall.id);
            }
            return updated;
          });
        });
      }

      // Check for content filter errors
      if (prompt.role === 'assistant' && prompt.contentFilterError) {
        setContentFilterErrors(true);
      }
    });
    setToolResponses(responseMap);
  }, [history]);

  // Update completed operations when tool responses change
  useEffect(() => {
    // Map each tool response to check if any are completed operations
    Object.entries(toolResponses).forEach(([toolCallId, response]) => {
      try {
        // Look through history to find the tool call data
        const toolCall = history
          .filter(p => p.role === 'assistant' && p.toolCalls)
          .flatMap(p => p.toolCalls || [])
          .find(tc => tc.id === toolCallId);

        if (toolCall) {
          const args = JSON.parse(toolCall.function.arguments || '{}');
          
          // Only track non-GET operations for completion
          if (args.method?.toUpperCase() !== 'GET') {
            // Check if the response indicates completion
            const isCompleted = checkIfOperationCompleted(response);
            
            if (isCompleted) {
              setCompletedOperations(prev => {
                const updated = new Set(prev);
                updated.add(toolCallId);
                return updated;
              });
            }
          }
        }
      } catch (e) {
        // Error parsing, ignore
        console.warn('Error checking completion status:', e);
      }
    });
  }, [toolResponses, history]);

  // Function to check if an operation has been completed
  const checkIfOperationCompleted = (response: string): boolean => {
    if (!response) return false;
    
    // Check for standard success indicators in string form
    if (response.toLowerCase().includes('successfully') || 
        response.toLowerCase().includes('created') || 
        response.toLowerCase().includes('updated') ||
        response.toLowerCase().includes('applied') ||
        response.toLowerCase().includes('deleted') ||
        response.toLowerCase().includes('processing')) {
      return true;
    }
    
    // Check for specific phrases that indicate non-completion
    if (response.toLowerCase().includes('pending_confirmation') ||
        response.toLowerCase().includes('waiting for confirmation')) {
      return false;
    }
    
    try {
      // Try parsing as JSON to look for structured success indicators
      const parsed = JSON.parse(response);
      
      // If explicitly marked as pending, it's not completed
      if (parsed.status === 'pending_confirmation') {
        return false;
      }
      
      return (
        parsed.status === 'success' || 
        parsed.status === 'processing' ||
        (parsed.metadata && parsed.kind) || // Looks like a K8s resource
        (parsed.message && 
          (parsed.message.toLowerCase().includes('successfully') || 
           parsed.message.toLowerCase().includes('created') ||
           parsed.message.toLowerCase().includes('deleted') ||
           parsed.message.toLowerCase().includes('updated') ||
           parsed.message.toLowerCase().includes('applied')))
      );
    } catch (e) {
      // Not JSON or parsing failed, use default string check
      return false;
    }
  };

  useEffect(() => {
    // Look for YAML in tool responses
    Object.entries(toolResponses).forEach(([toolCallId, response]) => {
      try {
        // Try to parse the response as YAML
        const parsed = parseKubernetesYAML(response);
        if (parsed.isValid && parsed.resourceType) {
          console.log(`Found YAML in tool response: ${parsed.resourceType}`);
          // Store this YAML for potential use
          setDetectedYamls(prev => ({
            ...prev,
            [toolCallId]: {
              yaml: response,
              resourceType: parsed.resourceType,
              name: parsed.name,
            },
          }));
        }
      } catch (e) {
        // Not YAML, ignore
      }
    });
  }, [toolResponses]);

  const toggleExpand = (index: number) => {
    setExpandedTools(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleYamlDetected = (yaml: string, resourceType: string) => {
    // Since we're removing the Delete button, we'll set isDelete to false always
    setEditorContent(yaml);
    setEditorTitle(`Apply ${resourceType}`);
    setResourceType(resourceType);
    setIsDelete(false);  // Always false since we don't show delete button
    setShowEditor(true);
  };

  const handleYamlLibrarySelect = (yaml: string, title: string, resourceType: string) => {
    if (onYamlAction) {
      // Always pass isDelete as false
      onYamlAction(yaml, title, resourceType, false);
    } else {
      handleYamlDetected(yaml, resourceType);
    }
  };

  const renderMessage = (prompt: Prompt, index: number) => {
    if (prompt.role === 'system' || prompt.role === 'tool') {
      return null;
    }

    // Check if this is a content filter error or if the prompt has its own error
    const isContentFilterError = prompt.role === 'assistant' && prompt.contentFilterError;
    const hasError = prompt.error === true;

    return (
      <Box
        key={index}
        sx={{
          mb: 2,
          p: 1.5,
          borderRadius: 1,
          bgcolor: prompt.role === 'user' ? theme.palette.info.main : 'background.paper',
          border: '1px solid',
          borderColor: isContentFilterError || hasError ? 'error.main' : 'divider',
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
                  <YamlContentProcessor
                    content={prompt.content || ''}
                    onYamlDetected={(yaml, resourceType) => {
                      if (onYamlAction) {
                        // Simply pass the YAML to the parent handler
                        onYamlAction(
                          yaml,
                          `Apply ${resourceType}`,
                          resourceType,
                          false
                        );
                      } else {
                        handleYamlDetected(yaml, resourceType);
                      }
                    }}
                  />

                  {/* Display tool calls and responses if available */}
                  {prompt.toolCalls && prompt.toolCalls.length > 0 && (
                    <ToolResponseDisplay
                      toolCalls={prompt.toolCalls}
                      toolResponses={toolResponses}
                      expandedTools={expandedTools}
                      toggleExpand={toggleExpand}
                    />
                  )}
                </>
              )}
            </>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      {/* Content filter guidance when errors are detected */}
      {contentFilterErrors && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Some requests have been blocked by content filters. Please ensure your questions focus
            only on Kubernetes tasks.
          </Typography>
        </Alert>
      )}

      {/* YAML Library button at the top */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<Icon icon="mdi:kubernetes" />}
          size="small"
          onClick={() => setShowYamlLibrary(true)}
        >
          YAML Examples
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {history.map((prompt, index) => renderMessage(prompt, index))}

      {isLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} sx={{ mr: 1 }} />
          <Typography>Processing your request...</Typography>
        </Box>
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

      {/* YAML Library Dialog */}
      <YamlLibraryDialog
        open={showYamlLibrary}
        onClose={() => setShowYamlLibrary(false)}
        onSelectYaml={handleYamlLibrarySelect}
      />

      {/* Editor Dialog */}
      <EditorDialog
        open={showEditor}
        onClose={() => setShowEditor(false)}
        yamlContent={editorContent}
        title={editorTitle}
        resourceType={resourceType}
        isDelete={isDelete}
        onSuccess={(response) => {
          if (onOperationSuccess) {
            onOperationSuccess(response);
          }
          
          // Mark all pending operations as completed
          pendingToolCalls.forEach(toolCallId => {
            setCompletedOperations(prev => {
              const updated = new Set(prev);
              updated.add(toolCallId);
              return updated;
            });
            
            // Update the tool response to reflect completion
            setToolResponses(prev => {
              if (prev[toolCallId] && prev[toolCallId].includes('pending_confirmation')) {
                return {
                  ...prev,
                  [toolCallId]: JSON.stringify({
                    status: 'success',
                    message: `${resourceType || 'Resource'} applied successfully`,
                    resourceType: response.kind || resourceType,
                    name: response.metadata?.name || '',
                    namespace: response.metadata?.namespace || '',
                  })
                };
              }
              return prev;
            });
          });
        }}
      />
    </Box>
  );
}
