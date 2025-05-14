import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { Prompt } from './ai/manager';
import EditorDialog from './editordialog';
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
  const [showEditor, setShowEditor] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [editorTitle, setEditorTitle] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [isDelete, setIsDelete] = useState(false);
  const theme = useTheme();
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
  }, [history]);

  const handleYamlDetected = (yaml: string, resourceType: string) => {
    // Since we're removing the Delete button, we'll set isDelete to false always
    setEditorContent(yaml);
    setEditorTitle(`Apply ${resourceType}`);
    setResourceType(resourceType);
    setIsDelete(false); // Always false since we don't show delete button
    setShowEditor(true);
  };

  const renderMessage = (prompt: Prompt, index: number) => {
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
    if(prompt.content === '' && prompt.role === 'assistant') return null;
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
                        onYamlAction(yaml, `Apply ${resourceType}`, resourceType, false);
                      } else {
                        handleYamlDetected(yaml, resourceType);
                      }
                    }}
                  />
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
