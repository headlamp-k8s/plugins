import { Icon } from '@iconify/react';
import { Alert, Box, Button, CircularProgress, Divider, Typography } from '@mui/material';
import React from 'react';
import { useEffect, useState } from 'react';
import ToolResponseDisplay from './components/ToolResponseDisplay';
import YamlLibraryDialog from './components/YamlLibraryDialog';
import EditorDialog from './editordialog';
import { parseKubernetesYAML } from './utils/SampleYamlLibrary';
import YamlContentProcessor from './YamlContentProcessor';

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

  // Track if content filter errors were detected
  const [contentFilterErrors, setContentFilterErrors] = useState<boolean>(false);

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
    setToolResponses(responseMap);
  }, [history]);

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

  const handleYamlDetected = (yaml: string, resourceType: string, isDelete: boolean) => {
    setEditorContent(yaml);
    setEditorTitle(isDelete ? `Delete ${resourceType}` : `Apply ${resourceType}`);
    setResourceType(resourceType);
    setIsDelete(isDelete);
    setShowEditor(true);
  };

  const handleYamlLibrarySelect = (yaml: string, title: string, resourceType: string) => {
    if (onYamlAction) {
      // Always pass isDelete as false for examples from the YAML library
      onYamlAction(yaml, title, resourceType, false);
    } else {
      // Always pass isDelete as false for examples from the YAML library
      handleYamlDetected(yaml, resourceType, false);
    }
  };

  // Enhanced function to check if text contains indicators that the content is just examples
  const isSampleContent = (content: string): boolean => {
    if (!content) return false;

    const lowerContent = content.toLowerCase();

    // Check for keywords indicating this is an example
    const hasExampleKeywords =
      lowerContent.includes('example yaml') ||
      lowerContent.includes('sample yaml') ||
      lowerContent.includes('sample kubernetes resource') ||
      (lowerContent.includes('sample') && lowerContent.includes('kubectl apply'));

    // Check for kubectl commands which suggest this is example content
    const hasKubectlCommand =
      lowerContent.includes('kubectl apply') ||
      lowerContent.includes('kubectl create') ||
      lowerContent.includes('kubectl delete');

    // If there's a kubectl command but it appears to be a user instruction rather than
    // actual code meant to be run directly, we'll consider this example content
    if (hasKubectlCommand) {
      // Look for instructional language near kubectl commands
      const isInstruction =
        lowerContent.includes('you can use') ||
        lowerContent.includes('you could') ||
        lowerContent.includes('you would') ||
        lowerContent.includes('to apply') ||
        lowerContent.includes('to create') ||
        lowerContent.includes('for example');

      // If it's phrased as an instruction, it's likely example content
      return isInstruction || hasExampleKeywords;
    }

    return hasExampleKeywords;
  };

  const renderMessage = (prompt: Prompt, index: number) => {
    if (prompt.role === 'system' || prompt.role === 'tool') {
      return null;
    }

    // Determine if this is likely sample content
    const showDeleteOption =
      prompt.role === 'assistant' ? !isSampleContent(prompt.content || '') : true;

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
          bgcolor: prompt.role === 'user' ? 'primary.light' : 'background.paper',
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
                    onYamlDetected={(yaml, resourceType, isDelete) => {
                      // If this is a sample and user tried to delete, prevent it
                      const actuallyDelete = showDeleteOption ? isDelete : false;

                      if (onYamlAction) {
                        onYamlAction(
                          yaml,
                          actuallyDelete ? `Delete ${resourceType}` : `Apply ${resourceType}`,
                          resourceType,
                          actuallyDelete
                        );
                      } else {
                        handleYamlDetected(yaml, resourceType, actuallyDelete);
                      }
                    }}
                    showDeleteOption={showDeleteOption}
                    replaceKubectlSuggestions
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
        onSuccess={onOperationSuccess}
      />
    </Box>
  );
}
