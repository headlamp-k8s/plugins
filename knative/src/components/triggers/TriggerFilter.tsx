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
import type { KnativeTrigger } from '../../resources/knative';
import { formatTriggerFilter } from '../../resources/knative/eventingData';

/**
 * Shows the active Trigger filter as read-only, syntax-highlighted YAML.
 *
 * @param props - The Trigger spec whose filter is shown.
 * @returns The filter as YAML, or `All events` when the Trigger filters nothing.
 */
export function TriggerFilter({
  spec,
}: {
  /** The Trigger's spec, which holds `filters` or the older `filter`. */
  spec: KnativeTrigger['spec'];
}) {
  const theme = useTheme();
  const value = formatTriggerFilter(spec);

  if (!value) {
    return <>All events</>;
  }

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
          ariaLabel: 'Trigger filter YAML',
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
