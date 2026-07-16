import { Icon } from '@iconify/react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { Button } from '@mui/material';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseKubernetesYAML } from '../../../parsing/yamlParser';

/** Props for {@link YamlDisplay}. */
export interface YamlDisplayProps {
  /** YAML content to parse and display. */
  yaml: string;
  /** Optional heading shown above the YAML preview. */
  title?: string;
  /**
   * Opens the YAML in an external editor flow.
   *
   * @param yaml - Formatted YAML with common indentation normalized.
   * @param resourceType - Parsed Kubernetes kind or `Resource` fallback.
   * @param title - Host title or translated `Apply <kind>` fallback.
   * @returns No value.
   */
  onOpenInEditor?: (yaml: string, resourceType: string, title?: string) => void;
}

/**
 * Renders Kubernetes YAML in a read-only editor with resource metadata.
 * Exact document markers and decorative horizontal separators are removed,
 * while relative YAML indentation and machine identifiers are preserved.
 *
 * @param props - YAML content, optional title, and editor callback.
 * @returns Read-only YAML preview and optional editor action.
 */
const YamlDisplay: React.FC<YamlDisplayProps> = React.memo(({ yaml, title, onOpenInEditor }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [editor, setEditor] = useState<Parameters<OnMount>[0] | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const editorHeight = useMemo(() => 250, []); // Memoize to prevent recreation

  // Memoize the editor mount handler to prevent recreation
  const handleEditorMount: OnMount = useCallback(editorElem => {
    setEditor(editorElem);
  }, []);

  // Memoize the resize observer setup to prevent recreation
  const setupResizeObserver = useCallback(() => {
    if (!parentRef.current || !editor || typeof window.ResizeObserver !== 'function') {
      return;
    }

    let currentResizingHandler: ReturnType<typeof setTimeout> | null = null;
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
            editor.layout({ width: Math.max(0, width - 20), height: editorHeight });
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
    const lines = yamlString.trim().split(/\r?\n/);
    if (lines[0]?.trim() === '---') lines.shift();
    if (lines.at(-1)?.trim() === '---') lines.pop();
    const contentLines = lines.filter(line => !/^─{3,}$/.test(line.trim()));

    // Remove any common leading spaces
    const minIndent =
      contentLines
        .filter(line => line?.trim().length > 0)
        .reduce((min, line) => {
          const leadingSpaces = (line.match(/^\s*/) ?? [''])[0].length;
          return leadingSpaces < min ? leadingSpaces : min;
        }, Infinity) || 0;

    // Reformat lines with proper indentation
    return contentLines
      .map(line => (line.length > minIndent ? line.substring(minIndent) : line))
      .join('\n');
  }, []);

  // Memoized YAML processing to avoid recomputation when content hasn't changed
  const { formattedYaml, parsedInfo } = useMemo(() => {
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
  }, [yaml, formatYaml]);

  const handleOpenInEditor = useCallback(() => {
    onOpenInEditor?.(
      formattedYaml,
      parsedInfo.resourceType,
      title || t('Apply {{resourceType}}', { resourceType: parsedInfo.resourceType })
    );
  }, [formattedYaml, onOpenInEditor, parsedInfo.resourceType, t, title]);

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
        <Typography variant="subtitle2" component="div" gutterBottom fontWeight="medium">
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
            {parsedInfo.resourceType === 'Resource' ? t('Resource') : parsedInfo.resourceType}
            {parsedInfo.resourceName ? `: ${parsedInfo.resourceName}` : ''}
          </Typography>

          {onOpenInEditor && (
            <Button
              variant="contained"
              size="small"
              startIcon={<Icon icon="mdi:file-edit-outline" aria-hidden="true" />}
              onClick={handleOpenInEditor}
            >
              {t('Open In Editor')}
            </Button>
          )}
        </Box>

        <Box
          role="region"
          aria-label={t('YAML preview for {{resourceType}}', {
            resourceType: parsedInfo.resourceType,
          })}
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
              value={formattedYaml}
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
});

YamlDisplay.displayName = 'YamlDisplay';

export default YamlDisplay;
