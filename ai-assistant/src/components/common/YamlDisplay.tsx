import { Icon } from '@iconify/react';
import Editor from '@monaco-editor/react';
import { Button } from '@mui/material';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseKubernetesYAML } from '../../utils/SampleYamlLibrary';

interface YamlDisplayProps {
  yaml: string;
  title?: string;
  onOpenInEditor: (yaml: string, resourceType: string, title?: string) => void;
}

const YamlDisplay: React.FC<YamlDisplayProps> = React.memo(
  ({ yaml, title, onOpenInEditor }) => {
    const [resourceType, setResourceType] = useState<string>('Resource');
    const [resourceName, setResourceName] = useState<string>('');
    const [processedYaml, setProcessedYaml] = useState<string>(yaml);
    const theme = useTheme();
    const [editor, setEditor] = useState<any>(null);
    const parentRef = useRef<HTMLDivElement>(null);
    const editorHeight = useMemo(() => 250, []); // Memoize to prevent recreation

    // Memoize the editor mount handler to prevent recreation
    const handleEditorMount = useCallback((editorElem: any) => {
      setEditor(editorElem);
    }, []);

    // Memoize the resize observer setup to prevent recreation
    const setupResizeObserver = useCallback(() => {
      if (!parentRef.current || !editor) {
        return;
      }

      let currentResizingHandler: NodeJS.Timeout | null = null;
      const resizeObserver = new window.ResizeObserver(() => {
        let width = 0;
        if (parentRef.current) {
          width = parentRef.current.offsetWidth;
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
        if (currentResizingHandler) {
          clearTimeout(currentResizingHandler);
        }
      };
    }, [editor, editorHeight]);

    // Use the memoized setup function in useEffect
    useEffect(() => {
      return setupResizeObserver();
    }, [setupResizeObserver]);

    // Memoize editor options to prevent re-creation
    const editorOptions = useMemo(
      () => ({
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
      }),
      []
    );

    // Memoized function to properly format YAML indentation
    const formatYaml = useCallback((yamlString: string): string => {
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
    }, []);

    // Memoized YAML processing to avoid recomputation when content hasn't changed
    const { formattedYaml, parsedInfo } = useMemo(() => {
      try {
        const formatted = formatYaml(yaml);
        const parsed = parseKubernetesYAML(formatted);

        return {
          formattedYaml: formatted,
          parsedInfo: parsed.isValid
            ? {
                resourceType: parsed.resourceType || 'Resource',
                resourceName: parsed.name || '',
              }
            : {
                resourceType: 'Resource',
                resourceName: '',
              },
        };
      } catch (e) {
        console.warn('Error parsing YAML:', e);
        return {
          formattedYaml: yaml,
          parsedInfo: {
            resourceType: 'Resource',
            resourceName: '',
          },
        };
      }
    }, [yaml, formatYaml]);

    // Update state only when processed values change
    useEffect(() => {
      setProcessedYaml(formattedYaml);
      setResourceType(parsedInfo.resourceType);
      setResourceName(parsedInfo.resourceName);
    }, [formattedYaml, parsedInfo]);

    // Memoize the onOpenInEditor callback to prevent unnecessary re-renders
    const memoizedOnOpenInEditor = useCallback(
      (yaml: string, resourceType: string, title?: string) => {
        onOpenInEditor(yaml, resourceType, title);
      },
      [onOpenInEditor]
    );

    const handleOpenInEditor = useCallback(() => {
      memoizedOnOpenInEditor(processedYaml, resourceType, title || `Apply ${resourceType}`);
    }, [memoizedOnOpenInEditor, processedYaml, resourceType, title]);

    // Memoize the theme value to prevent re-renders when theme object changes
    const editorTheme = useMemo(() => {
      return theme.palette.mode === 'dark' ? 'vs-dark' : 'light';
    }, [theme.palette.mode]);

    // Memoize editor container style to prevent re-creation
    const editorContainerStyle = useMemo(
      () => ({
        height: `${editorHeight}px`,
        width: '100%',
        maxWidth: '100%',
        position: 'relative' as const,
        overflow: 'hidden' as const,
        boxSizing: 'border-box' as const,
      }),
      [editorHeight]
    );

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
            <div style={editorContainerStyle}>
              <Editor
                language="yaml"
                theme={editorTheme}
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
  },
  // Improve memo comparison for better stability
  (prevProps, nextProps) => {
    // Only re-render if yaml or title actually changed
    // Don't compare onOpenInEditor function reference as it might change but be functionally equivalent
    return prevProps.yaml === nextProps.yaml && prevProps.title === nextProps.title;
  }
);

YamlDisplay.displayName = 'YamlDisplay';

export default YamlDisplay;
