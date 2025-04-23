import Editor from '@monaco-editor/react';
import { Box } from '@mui/material';
import React from 'react';

interface YamlPreviewProps {
  content: string;
  height?: string;
  readOnly?: boolean;
  border?: boolean;
}

/**
 * Component for displaying YAML content with proper syntax highlighting
 * that respects the user's theme preference
 */
export default function YamlPreview({
  content,
  height = '300px',
  readOnly = true,
  border = true,
}: YamlPreviewProps) {
  // Get theme from localStorage to match Headlamp's current theme
  const themeName = localStorage.getItem('headlampThemePreference');
  const isDarkTheme = themeName === 'dark';

  return (
    <Box
      sx={{
        border: border ? '1px solid' : 'none',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <Editor
        value={content}
        height={height}
        language="yaml"
        theme={isDarkTheme ? 'vs-dark' : 'light'}
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          folding: true,
          lineNumbers: 'on',
          wordWrap: 'on',
          automaticLayout: true,
        }}
      />
    </Box>
  );
}
