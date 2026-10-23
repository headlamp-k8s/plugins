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

import type { ConversationMessage } from '@headlamp-k8s/ai-common/conversation/types';
import { Icon } from '@iconify/react';
import Editor from '@monaco-editor/react';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateSessionMarkdown } from '../../../formatting/sessionExport';
import { DefaultDialog } from '../../defaults/DefaultSlots/DefaultSlots';

export interface ExportSessionDialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Callback to close the dialog. */
  onClose: () => void;
  /** Conversation messages to export. */
  messages: ConversationMessage[];
  /** Optional active cluster identifier. */
  cluster?: string;
  /** Optional list of selected cluster names. */
  clusters?: string[];
  /** Component used to render the dialog shell. Falls back to DefaultDialog. */
  DialogSlot?: React.ElementType;
}

/**
 * Dialog displaying an exportable Markdown preview of the AI session.
 *
 * Provides a rich formatted preview, Monaco editor Markdown source view,
 * one-click copy to clipboard, and file download options in native Headlamp style.
 *
 * @param props - Dialog state, messages, cluster metadata, and optional shell slot.
 * @returns Modal export dialog.
 */
export default function ExportSessionDialog({
  open,
  onClose,
  messages,
  cluster,
  clusters,
  DialogSlot = DefaultDialog,
}: ExportSessionDialogProps): React.ReactElement {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [tabValue, setTabValue] = React.useState<number>(0);
  const [copied, setCopied] = React.useState(false);
  const titleId = React.useId();
  const descriptionId = React.useId();

  const markdown = React.useMemo(() => {
    if (!open) return '';
    return generateSessionMarkdown({ messages, cluster, clusters });
  }, [open, messages, cluster, clusters]);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [markdown]);

  const handleDownload = React.useCallback(() => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `headlamp-ai-session-${timestamp}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [markdown]);

  const getEditorTheme = React.useCallback((): 'vs-dark' | 'light' => {
    try {
      return localStorage.getItem('headlampThemePreference') === 'dark' || isDark
        ? 'vs-dark'
        : 'light';
    } catch {
      return isDark ? 'vs-dark' : 'light';
    }
  }, [isDark]);

  return (
    <DialogSlot
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <DialogTitle component="div" id={titleId} sx={{ p: 2, px: 3, pb: 1.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1.2}>
            <Icon icon="mdi:export-variant" width={24} height={24} aria-hidden="true" />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              {t('Export Troubleshooting Session')}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} aria-label={t('Close dialog')} edge="end">
            <Icon icon="mdi:close" width={20} height={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, px: 3, height: '68vh', display: 'flex', flexDirection: 'column' }}>
        <Typography id={descriptionId} variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {t('Review and copy or download the conversation report as Markdown.')}
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={(_event: React.SyntheticEvent, newValue: number) => setTabValue(newValue)}
            aria-label={t('Session report view tabs')}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              minHeight: 44,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.875rem',
                minHeight: 44,
                py: 1,
              },
            }}
          >
            <Tab
              id="export-tab-preview"
              aria-controls="export-tabpanel-preview"
              label={t('Preview')}
              icon={<Icon icon="mdi:eye-outline" width={18} height={18} />}
              iconPosition="start"
            />
            <Tab
              id="export-tab-markdown"
              aria-controls="export-tabpanel-markdown"
              label={t('Markdown')}
              icon={<Icon icon="mdi:code-tags" width={18} height={18} />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <Paper
          variant="outlined"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 1,
            borderColor: 'divider',
            mt: 1.5,
            mb: 1.5,
            bgcolor: 'background.paper',
          }}
        >
          {/* Tab 0: Formatted Markdown Preview */}
          <Box
            id="export-tabpanel-preview"
            role="tabpanel"
            aria-labelledby="export-tab-preview"
            hidden={tabValue !== 0}
            sx={{
              display: tabValue === 0 ? 'block' : 'none',
              height: '100%',
              overflowY: 'auto',
              p: 3,
              bgcolor: 'background.paper',
              color: 'text.primary',
              '& h1': {
                fontSize: '1.4rem',
                fontWeight: 600,
                mt: 0,
                mb: 1.5,
                borderBottom: 1,
                borderColor: 'divider',
                pb: 1,
                color: 'text.primary',
              },
              '& h2': {
                fontSize: '1.2rem',
                fontWeight: 600,
                mt: 2.5,
                mb: 1,
                borderBottom: 1,
                borderColor: 'divider',
                pb: 0.5,
                color: 'text.primary',
              },
              '& h3': {
                fontSize: '1.05rem',
                fontWeight: 600,
                mt: 2,
                mb: 1,
                color: 'text.primary',
              },
              '& p': {
                my: 1,
                lineHeight: 1.6,
                color: 'text.primary',
                fontSize: '0.875rem',
              },
              '& ul, & ol': {
                pl: 3,
                my: 1,
                color: 'text.primary',
                fontSize: '0.875rem',
              },
              '& li': {
                my: 0.5,
                lineHeight: 1.5,
              },
              '& table': {
                width: '100%',
                borderCollapse: 'collapse',
                my: 2,
              },
              '& th, & td': {
                border: '1px solid',
                borderColor: 'divider',
                px: 1.5,
                py: 0.75,
                textAlign: 'left',
                fontSize: '0.875rem',
              },
              '& th': {
                fontWeight: 600,
                bgcolor: (t: Theme) =>
                  t.palette.mode === 'dark' ? t.palette.action.hover : t.palette.grey[100],
              },
              '& code': {
                bgcolor: (t: Theme) =>
                  t.palette.mode === 'dark' ? t.palette.grey[800] : t.palette.grey[100],
                color: (t: Theme) =>
                  t.palette.mode === 'dark' ? t.palette.grey[100] : t.palette.grey[900],
                px: 0.6,
                py: 0.2,
                borderRadius: 0.5,
                fontSize: '0.85em',
                fontFamily:
                  'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
              },
              '& pre': {
                bgcolor: (t: Theme) =>
                  t.palette.mode === 'dark' ? t.palette.grey[800] : t.palette.grey[100],
                color: (t: Theme) =>
                  t.palette.mode === 'dark' ? t.palette.grey[100] : t.palette.grey[900],
                p: 1.5,
                borderRadius: 1,
                overflow: 'auto',
                my: 1.5,
              },
              '& pre code': {
                bgcolor: 'transparent',
                p: 0,
                color: 'inherit',
              },
              '& blockquote': {
                borderLeft: '4px solid',
                borderColor: 'primary.main',
                pl: 1.5,
                py: 0.5,
                my: 1.5,
                bgcolor: (t: Theme) => t.palette.action.hover,
                borderRadius: '0 4px 4px 0',
                color: 'text.secondary',
              },
              '& a': {
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              },
              '& hr': {
                border: 'none',
                borderTop: '1px solid',
                borderColor: 'divider',
                my: 2,
              },
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </Box>

          {/* Tab 1: Monaco Editor view */}
          <Box
            id="export-tabpanel-markdown"
            role="tabpanel"
            aria-labelledby="export-tab-markdown"
            hidden={tabValue !== 1}
            sx={{
              display: tabValue === 1 ? 'block' : 'none',
              height: '100%',
            }}
          >
            <Editor
              value={markdown}
              language="markdown"
              height="100%"
              options={{
                readOnly: true,
                selectOnLineNumbers: true,
                minimap: { enabled: false },
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                fontSize: 13,
                fontFamily:
                  'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
                lineNumbers: 'on',
              }}
              theme={getEditorTheme()}
            />
          </Box>
        </Paper>

        {/* Accessible textarea for screen readers and testing environments */}
        <Box
          component="textarea"
          aria-label={t('Exported session report in Markdown')}
          readOnly
          value={markdown}
          sx={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, borderTop: 1, borderColor: 'divider', gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="primary">
          {t('Close')}
        </Button>
        <Button
          onClick={handleCopy}
          variant="outlined"
          color="primary"
          startIcon={<Icon icon={copied ? 'mdi:check' : 'mdi:content-copy'} aria-hidden="true" />}
        >
          {copied ? t('Copied!') : t('Copy to Clipboard')}
        </Button>
        <Button
          onClick={handleDownload}
          variant="contained"
          color="primary"
          startIcon={<Icon icon="mdi:download" aria-hidden="true" />}
        >
          {t('Download as Markdown')}
        </Button>
      </DialogActions>
    </DialogSlot>
  );
}
