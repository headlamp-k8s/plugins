import { Icon } from '@iconify/react';
import Editor from '@monaco-editor/react';
import { Button } from '@mui/material';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { parseKubernetesYAML } from '../utils/SampleYamlLibrary';

interface YamlDisplayProps {
  yaml: string;
  title?: string;
  onOpenInEditor: (yaml: string, resourceType: string, title?: string) => void;
}

const YamlDisplay: React.FC<YamlDisplayProps> = ({ yaml, title, onOpenInEditor }) => {
  const [resourceType, setResourceType] = useState<string>('Resource');
  const [resourceName, setResourceName] = useState<string>('');
  const [processedYaml, setProcessedYaml] = useState<string>(yaml);
  const theme = useTheme();
  const [editor, setEditor] = useState<any>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const editorHeight = 250;

  const handleEditorMount = useCallback((editorElem: any) => {
    setEditor(editorElem);
  }, []);

  useEffect(() => {
    if (!parentRef.current || !editor) {
      return;
    }

    let currentResizingHandler: NodeJS.Timeout | null = null;
    const resizeObserver = new window.ResizeObserver(() => {
      let width = 0;
      if (parentRef.current) {
        width = parentRef.current.offsetWidth;
        console.log('Parent width:', width);
      }

      if (editor) {
        if (currentResizingHandler) {
          clearTimeout(currentResizingHandler);
          currentResizingHandler = null;
        }
        // Setting width to 0 is important, else this could trigger a
        // resize of the window when resizing from wider to narrower which
        // would have an effect of the editor slowly adapting to the size
        // instead of in one go.
        editor.layout({ width: 0, height: editorHeight });
        currentResizingHandler = setTimeout(() => {
          console.log('>>>>>>>>>>>>>>>>>>>>>>>RESIZE')
          if (editor) {
            // If we set the width to the same width as the parent, the editor
            // will trigger a resize of the parent and this will hit race conditions
            editor.layout({ width: width - 20, height: editorHeight });
          }
        }, 100);
      }
    });

    resizeObserver.observe(parentRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [editor]);

  // Memoize editor options to prevent re-creation
  const editorOptions = useMemo(() => ({
    readOnly: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    folding: true,
    wordWrap: 'on' as const,
    automaticLayout: false,
    scrollbar: {
      horizontal: 'hidden' as const,
      vertical: 'auto' as const,
    },
  }), []);

  // Function to properly format YAML indentation
  const formatYaml = (yamlString: string): string => {
    // Clean up YAML content
    let cleanYaml = yamlString.trim();

    // Remove leading '---' if present
    if (cleanYaml.startsWith('---')) {
      cleanYaml = cleanYaml.substring(3).trim();
    }

    // Remove trailing '---' if present
    if (cleanYaml.endsWith('---')) {
      cleanYaml = cleanYaml.substring(0, cleanYaml.length - 3).trim();
    }

    // Remove horizontal separators
    cleanYaml = cleanYaml.replace(/^[─]{3,}$/gm, '').trim();

    // Fix indentation by normalizing whitespace
    // Split into lines
    const lines = cleanYaml.split('\n');
    // Remove any common leading spaces
    const minIndent =
      lines
        .filter(line => line.trim().length > 0)
        .reduce((min, line) => {
          const leadingSpaces = line.match(/^\s*/)[0].length;
          return leadingSpaces < min ? leadingSpaces : min;
        }, Infinity) || 0;

    // Reformat lines with proper indentation
    return lines
      .map(line => (line.length > minIndent ? line.substring(minIndent) : line))
      .join('\n');
  };

  useEffect(() => {
    try {
      const formattedYaml = formatYaml(yaml);
      setProcessedYaml(formattedYaml);

      // Parse YAML to get resource information
      const parsed = parseKubernetesYAML(formattedYaml);
      if (parsed.isValid) {
        setResourceType(parsed.resourceType || 'Resource');
        setResourceName(parsed.name || '');
      }
    } catch (e) {
      console.warn('Error parsing YAML:', e);
    }
  }, [yaml]);

  const handleOpenInEditor = () => {
    onOpenInEditor(processedYaml, resourceType, title || `Apply ${resourceType}`);
  };

  return (
    <Box sx={{ my: 2 }}>
      {title && (
        <Typography variant="subtitle2" gutterBottom fontWeight="medium">
          {title}
        </Typography>
      )}

      <Paper
        elevation={1}
        sx={{
          position: 'relative',
          borderRadius: 1,
          overflow: 'hidden',
          borderLeft: '4px solid',
          borderColor: 'primary.main',
          width: '100%',
          maxWidth: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            py: 1,
            bgcolor: theme =>
              theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.05)',
            borderBottom: '1px solid',
            borderColor: theme =>
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }}
        >
          <Typography variant="caption" fontWeight="bold">
            {resourceType}
            {resourceName ? `: ${resourceName}` : ''}
          </Typography>

          <Button
            variant="contained"
            size="small"
            startIcon={<Icon icon="mdi:file-edit-outline" />}
            onClick={handleOpenInEditor}
          >
            Open In Editor
          </Button>
        </Box>

        <Box
          sx={{
            height: `${editorHeight}px`,
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
          }}
          ref={parentRef}
        >
            <div style={{
              height: `${editorHeight}px`,
              width: '100%',
              maxWidth: '100%',
              position: 'relative',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}>
              <Editor
                language="yaml"
                theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'light'}
                value={processedYaml}
                options={editorOptions}
                height={editorHeight}
                width="100%"
                onMount={handleEditorMount}
              />
            </div>
        </Box>
      </Paper>
    </Box>
  );
};

export default YamlDisplay;
