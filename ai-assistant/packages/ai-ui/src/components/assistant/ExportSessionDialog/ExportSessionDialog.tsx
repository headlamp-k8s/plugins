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
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { generateSessionMarkdown } from '../../../formatting/sessionExport';

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
}

/**
 * Dialog displaying an exportable Markdown preview of the AI session.
 *
 * Provides one-click copy to clipboard and file download options.
 *
 * @param props - Dialog state, messages, and cluster metadata.
 * @returns Modal export dialog.
 */
export default function ExportSessionDialog({
  open,
  onClose,
  messages,
  cluster,
  clusters,
}: ExportSessionDialogProps): React.ReactElement {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);
  const titleId = React.useId();
  const descriptionId = React.useId();

  const markdown = React.useMemo(() => {
    return generateSessionMarkdown({ messages, cluster, clusters });
  }, [messages, cluster, clusters]);

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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <DialogTitle id={titleId}>{t('Export Troubleshooting Session')}</DialogTitle>
      <DialogContent>
        <DialogContentText id={descriptionId} sx={{ mb: 1 }}>
          {t('Review and copy or download the conversation report as Markdown.')}
        </DialogContentText>
        <Box
          component="textarea"
          readOnly
          aria-label={t('Exported session report in Markdown')}
          value={markdown}
          sx={{
            width: '100%',
            minHeight: 320,
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            backgroundColor: 'action.hover',
            color: 'text.primary',
            resize: 'vertical',
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{t('Close')}</Button>
        <Button
          onClick={handleCopy}
          variant="outlined"
          startIcon={<Icon icon="mdi:content-copy" aria-hidden="true" />}
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
    </Dialog>
  );
}
