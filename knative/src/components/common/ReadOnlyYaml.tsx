/*
 * Copyright 2026 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Editor from '@monaco-editor/react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

/**
 * Shows YAML read-only and syntax-highlighted, such as a Trigger's filter or the settings of a
 * channel implementation.
 *
 * @param props - The YAML and its accessible name.
 * @returns The YAML in a read-only editor.
 */
export function ReadOnlyYaml({
  value,
  ariaLabel,
}: {
  /** The YAML to show. */
  value: string;
  /** The editor's accessible name, such as `Trigger filter YAML`. */
  ariaLabel: string;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: '100%',
        minWidth: 0,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          px: 1.5,
          py: 0.5,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption">YAML</Typography>
        <Typography variant="caption" color="text.secondary">
          Read only
        </Typography>
      </Box>
      <Editor
        language="yaml"
        value={value}
        height={Math.min(360, value.split('\n').length * 20 + 16)}
        theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'light'}
        options={{
          ariaLabel,
          readOnly: true,
          domReadOnly: true,
          automaticLayout: true,
          minimap: { enabled: false },
          lineNumbers: 'off',
          folding: false,
          renderLineHighlight: 'none',
          overviewRulerLanes: 0,
          scrollBeyondLastLine: false,
          scrollbar: { alwaysConsumeMouseWheel: false },
          wordWrap: 'on',
          fontSize: 13,
          lineHeight: 20,
          padding: { top: 8, bottom: 8 },
        }}
      />
    </Box>
  );
}
