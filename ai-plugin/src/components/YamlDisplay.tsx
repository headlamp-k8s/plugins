import { Icon } from '@iconify/react';
import Editor from '@monaco-editor/react';
import { Button } from '@mui/material';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import React, { useCallback, useMemo } from 'react';
import { parseKubernetesYAML } from '../utils/SampleYamlLibrary';

interface YamlDisplayProps {
  yaml: string;
  title?: string;
  onOpenInEditor: (yaml: string, resourceType: string, title?: string) => void;
}

const YamlDisplay: React.FC<YamlDisplayProps> = ({ yaml, title, onOpenInEditor }) => {
  const theme = useTheme();

  // Memoize editor options to prevent re-creation
  const editorOptions = useMemo(
    () => ({
      readOnly: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      folding: true,
    }),
    []
  );

  // Memoize YAML formatting function
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

  // Memoize processed YAML and resource info
  const { processedYaml, parsedInfo } = useMemo(() => {
    try {
      const formattedYaml = formatYaml(yaml);
      const parsed = parseKubernetesYAML(formattedYaml);

      return {
        processedYaml: formattedYaml,
        parsedInfo: parsed.isValid
          ? {
              resourceType: parsed.resourceType || 'Resource',
              name: parsed.name || '',
            }
          : {
              resourceType: 'Resource',
              name: '',
            },
      };
    } catch (e) {
      console.warn('Error parsing YAML:', e);
      return {
        processedYaml: yaml,
        parsedInfo: {
          resourceType: 'Resource',
          name: '',
        },
      };
    }
  }, [yaml, formatYaml]);

  // Memoize the click handler
  const handleOpenInEditor = useCallback(() => {
    onOpenInEditor(
      processedYaml,
      parsedInfo.resourceType,
      title || `Apply ${parsedInfo.resourceType}`
    );
  }, [onOpenInEditor, processedYaml, parsedInfo.resourceType, title]);

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
            {parsedInfo.resourceType}
            {parsedInfo.name ? `: ${parsedInfo.name}` : ''}
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

        <Editor
          language="yaml"
          theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'light'}
          value={processedYaml}
          options={editorOptions}
          height="250px"
        />
      </Paper>
    </Box>
  );
};

// Set display name for debugging
YamlDisplay.displayName = 'YamlDisplay';

// Custom comparison function for React.memo
const arePropsEqual = (prevProps: YamlDisplayProps, nextProps: YamlDisplayProps) => {
  return (
    prevProps.yaml === nextProps.yaml &&
    prevProps.title === nextProps.title &&
    prevProps.onOpenInEditor === nextProps.onOpenInEditor
  );
};

export default React.memo(YamlDisplay, arePropsEqual);
