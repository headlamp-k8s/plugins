/*
 * Copyright 2025 The Kubernetes Authors
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

import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Box, Typography } from '@mui/material';
import React from 'react';
import type { LogSeverity, StageLog } from '../types/pipecd';
import { logTimestamp } from '../utils/time';

/**
 * The PipeCD console renders stage logs on a fixed dark panel in both themes,
 * so these are literal colours rather than theme tokens.
 */
const PANEL_BG = '#282f3a';
const PANEL_HOVER_BG = '#323b48';
const GUTTER_COLOR = '#7c8ea4';
const TIMESTAMP_COLOR = '#9fb0c3';

const SEVERITY_COLORS: Record<LogSeverity, string> = {
  INFO: '#dbe3ec',
  SUCCESS: '#7ee787',
  ERROR: '#ff7b72',
};

interface StageLogsProps {
  log: StageLog | undefined;
}

export function StageLogs({ log }: StageLogsProps): JSX.Element {
  const { t } = useTranslation();

  if (!log || log.blocks.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('No logs available for this stage.')}
      </Typography>
    );
  }

  return (
    <Box
      aria-label="stage-logs"
      sx={{
        py: 1,
        maxHeight: 420,
        overflow: 'auto',
        borderRadius: 1,
        bgcolor: PANEL_BG,
        fontFamily: 'monospace',
        fontSize: '0.78rem',
        lineHeight: 1.7,
      }}
    >
      {log.blocks.map((block, lineNumber) => (
        <Box
          key={block.index}
          sx={{ display: 'flex', px: 1.5, '&:hover': { bgcolor: PANEL_HOVER_BG } }}
        >
          <Box
            component="span"
            aria-hidden="true"
            sx={{
              width: 34,
              pr: 1.5,
              flexShrink: 0,
              textAlign: 'right',
              color: GUTTER_COLOR,
              userSelect: 'none',
            }}
          >
            {lineNumber + 1}
          </Box>
          <Box
            component="span"
            sx={{
              color: SEVERITY_COLORS[block.severity],
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {block.createdAt > 0 && (
              <Box component="span" sx={{ color: TIMESTAMP_COLOR, mr: 1 }}>
                [{logTimestamp(block.createdAt)}]
              </Box>
            )}
            {block.log}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
