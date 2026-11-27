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

import { Icon } from '@iconify/react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { alpha, SxProps, Theme } from '@mui/material/styles';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { DiffRow } from '../helm/diff';

const COPIED_FEEDBACK_MS = 1500;

const codeSx: SxProps<Theme> = {
  m: 0,
  p: 1.5,
  maxHeight: '60vh',
  overflow: 'auto',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  fontSize: '0.8125rem',
  lineHeight: 1.5,
  whiteSpace: 'pre',
  border: 1,
  borderColor: 'divider',
  borderRadius: 1,
  bgcolor: 'action.hover',
};

function CopyTextButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      // The clipboard is optional: the text stays selectable in the block.
    }
  }

  return (
    <Tooltip title={copied ? 'Copied' : label}>
      <IconButton size="small" aria-label={copied ? 'Copied' : label} onClick={() => void copy()}>
        <Icon icon={copied ? 'mdi:check' : 'mdi:content-copy'} width={18} height={18} />
      </IconButton>
    </Tooltip>
  );
}

function BlockHeader({ caption, action }: { caption?: ReactNode; action?: ReactNode }) {
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" minHeight={34} mb={0.5}>
      <Typography variant="body2" color="text.secondary">
        {caption}
      </Typography>
      {action}
    </Box>
  );
}

export interface CodeBlockProps {
  text: string;
  /** Accessible name of the block, also used for its copy button. */
  label: string;
  caption?: ReactNode;
}

/** Read-only text block (YAML, notes), scrollable and copyable. What is copied is what is shown. */
export function CodeBlock({ text, label, caption }: CodeBlockProps) {
  return (
    <Box>
      <BlockHeader
        caption={caption}
        action={<CopyTextButton text={text} label={`Copy ${label}`} />}
      />
      <Box component="pre" role="region" aria-label={label} tabIndex={0} sx={codeSx}>
        {text}
      </Box>
    </Box>
  );
}

const DIFF_PREFIX = { same: ' ', added: '+', removed: '-' } as const;

export interface DiffBlockProps {
  rows: DiffRow[];
  label: string;
  caption?: ReactNode;
}

/** Unified diff. The `+` and `-` prefixes carry the meaning, the colours only reinforce it. */
export function DiffBlock({ rows, label, caption }: DiffBlockProps) {
  return (
    <Box>
      <BlockHeader caption={caption} />
      <Box component="pre" role="region" aria-label={label} tabIndex={0} sx={codeSx}>
        {/* As wide as the longest line, so that the line colours follow the horizontal scroll. */}
        <Box component="span" sx={{ display: 'inline-block', minWidth: '100%' }}>
          {rows.map((row, index) =>
            row.kind === 'gap' ? (
              <Box
                component="span"
                key={index}
                sx={{ display: 'block', color: 'text.secondary', fontStyle: 'italic' }}
              >
                {`  ⋯ ${row.count} unchanged ${row.count === 1 ? 'line' : 'lines'}`}
              </Box>
            ) : (
              <Box
                component="span"
                key={index}
                data-diff={row.kind}
                sx={theme => ({
                  display: 'block',
                  minHeight: '1.5em',
                  ...(row.kind === 'added' && {
                    backgroundColor: alpha(theme.palette.success.main, 0.2),
                  }),
                  ...(row.kind === 'removed' && {
                    backgroundColor: alpha(theme.palette.error.main, 0.2),
                  }),
                })}
              >
                {`${DIFF_PREFIX[row.kind]} ${row.text}`}
              </Box>
            )
          )}
        </Box>
      </Box>
    </Box>
  );
}
