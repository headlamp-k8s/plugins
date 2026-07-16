/**
 * LogsDialog — modal log viewer with Monaco editor, copy, and download.
 *
 * Renders a full-screen-capable dialog showing log content with syntax
 * highlighting, JSON auto-formatting, search, and copy/download actions.
 */

import { Icon } from '@iconify/react';
import Editor from '@monaco-editor/react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { getFormattedLogs, getLogLanguage } from '../../../formatting/logFormatting';

/** Props for the LogsDialog component that displays log content in a modal. */
export interface LogsDialogProps {
  /** Whether the dialog is currently visible. */
  open: boolean;
  /** Callback invoked when the dialog is closed. */
  onClose: () => void;
  /** The raw log text content to display. */
  logs: string;
  /** Title shown at the top of the dialog. */
  title: string;
  /** Optional Kubernetes resource name associated with these logs. */
  resourceName?: string;
  /** Component used to render the dialog shell. Falls back to MUI Dialog. */
  DialogSlot?: React.ElementType;
}

/**
 * Modal dialog for viewing Kubernetes resource logs with a Monaco code editor.
 *
 * Features:
 * - Automatic JSON detection and pretty-printing.
 * - Structured-log syntax highlighting (`key=value` patterns).
 * - Copy-to-clipboard and download-as-file actions.
 * - Full-width layout with a minimap for large log outputs.
 *
 * @param props - Dialog state, log content, metadata, and optional dialog slot.
 * @returns Read-only log viewer dialog.
 */
const LogsDialog: React.FC<LogsDialogProps> = ({
  open,
  onClose,
  logs,
  title,
  resourceName,
  DialogSlot = Dialog,
}) => {
  const { t } = useTranslation();
  const formattedLogs = logs ? getFormattedLogs(logs) : t('No logs available');

  /** Copies formatted logs to the system clipboard. @returns A promise settled after the attempt. */
  const copyToClipboard = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(formattedLogs);
    } catch (err) {
      console.error('Failed to copy logs to clipboard:', err);
    }
  };

  /** Downloads formatted logs with a filesystem-safe resource filename. @returns No value. */
  const downloadLogs = (): void => {
    const blob = new Blob([formattedLogs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const extension = getLogLanguage(logs) === 'json' ? 'json' : 'txt';
    const safeResourceName =
      (resourceName || t('resource')).replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') ||
      t('resource');
    a.download = `${safeResourceName}-logs.${extension}`;
    try {
      document.body.appendChild(a);
      a.click();
    } finally {
      a.remove();
      URL.revokeObjectURL(url);
    }
  };

  /** @returns Persisted Monaco theme, or light when browser storage is unavailable. */
  const getEditorTheme = (): 'vs-dark' | 'light' => {
    try {
      return localStorage.getItem('headlampThemePreference') === 'dark' ? 'vs-dark' : 'light';
    } catch {
      return 'light';
    }
  };

  return (
    <DialogSlot
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      aria-labelledby="logs-dialog-title"
    >
      <DialogTitle component="div">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography id="logs-dialog-title" variant="h6" component="h2">
            {t('{{title}} (Editor View)', { title })}
            {getLogLanguage(logs) === 'json' && (
              <Typography component="span" variant="caption" color="primary.main" sx={{ ml: 1 }}>
                {t('(Auto-formatted)')}
              </Typography>
            )}
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              size="small"
              startIcon={<Icon icon="mdi:content-copy" aria-hidden="true" />}
              onClick={copyToClipboard}
              variant="outlined"
            >
              {t('Copy')}
            </Button>
            <Button
              size="small"
              startIcon={<Icon icon="mdi:download" aria-hidden="true" />}
              onClick={downloadLogs}
              variant="outlined"
            >
              {t('Download')}
            </Button>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0, height: '70vh' }}>
        <Box height="100%" role="region" aria-label={t('Read-only logs for {{title}}', { title })}>
          <Editor
            value={formattedLogs}
            language={getLogLanguage(logs)}
            height="100%"
            options={{
              readOnly: true,
              selectOnLineNumbers: true,
              minimap: { enabled: true },
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              fontSize: 13,
              fontFamily:
                'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
              lineNumbers: 'on',
              rulers: [],
              folding: true,
              glyphMargin: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 4,
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
              find: {
                addExtraSpaceOnTop: false,
                autoFindInSelection: 'never',
                seedSearchStringFromSelection: 'always',
              },
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
                alwaysConsumeMouseWheel: false,
              },
              quickSuggestions: false,
              suggestOnTriggerCharacters: false,
              acceptSuggestionOnEnter: 'off',
              tabCompletion: 'off',
              wordBasedSuggestions: 'off',
              renderWhitespace: 'none',
              renderControlCharacters: false,
              smoothScrolling: true,
            }}
            theme={getEditorTheme()}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          {t('Close')}
        </Button>
      </DialogActions>
    </DialogSlot>
  );
};

export default LogsDialog;
