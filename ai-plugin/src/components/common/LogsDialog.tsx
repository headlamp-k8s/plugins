import { Icon } from '@iconify/react';
import { Dialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Editor from '@monaco-editor/react';
import { Box, Button, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import React from 'react';

interface LogsDialogProps {
  open: boolean;
  onClose: () => void;
  logs: string;
  title: string;
  resourceName?: string;
}

const LogsDialog: React.FC<LogsDialogProps> = ({ open, onClose, logs, title, resourceName }) => {
  const copyToClipboard = async () => {
    try {
      const formattedLogs = getFormattedLogs();
      await navigator.clipboard.writeText(formattedLogs);
    } catch (err) {
      console.error('Failed to copy logs to clipboard:', err);
    }
  };

  const downloadLogs = () => {
    const formattedLogs = getFormattedLogs();
    const blob = new Blob([formattedLogs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const extension = getLogLanguage() === 'json' ? 'json' : 'txt';
    a.download = `${resourceName || 'resource'}-logs.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get theme preference for Monaco editor
  const getEditorTheme = () => {
    const themeName = localStorage.getItem('headlampThemePreference');
    return themeName === 'dark' ? 'vs-dark' : 'light';
  };

  // Detect if logs contain JSON and set appropriate language
  const getLogLanguage = () => {
    if (!logs) return 'text';

    // Check if logs contain JSON-like structures
    const jsonPattern = /^\s*[\{\[].*[\}\]]\s*$/m;
    const hasJson = jsonPattern.test(logs);

    // Check if it looks like structured logs (common Kubernetes log formats)
    const structuredLogPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}|\w+\s*=\s*\w+|level=|msg=/m;
    const hasStructuredLogs = structuredLogPattern.test(logs);

    if (hasJson) return 'json';
    if (hasStructuredLogs) return 'properties'; // For key=value structured logs
    return 'text';
  };

  // Format logs for better readability
  const getFormattedLogs = () => {
    if (!logs) return 'No logs available';

    const language = getLogLanguage();

    if (language === 'json') {
      try {
        // Try to format as JSON - handle both single JSON objects and multiple JSON objects per line
        const lines = logs.split('\n');
        const formattedLines = lines.map(line => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return line;

          // Check if the line contains JSON objects
          if (trimmedLine.startsWith('{') && trimmedLine.includes('}')) {
            try {
              // Handle multiple JSON objects on the same line
              const jsonObjects = [];
              let currentJson = '';
              let braceCount = 0;
              let inString = false;
              let escapeNext = false;

              for (let i = 0; i < trimmedLine.length; i++) {
                const char = trimmedLine[i];
                currentJson += char;

                if (escapeNext) {
                  escapeNext = false;
                  continue;
                }

                if (char === '\\') {
                  escapeNext = true;
                  continue;
                }

                if (char === '"' && !escapeNext) {
                  inString = !inString;
                  continue;
                }

                if (!inString) {
                  if (char === '{') {
                    braceCount++;
                  } else if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                      // Complete JSON object found
                      try {
                        const parsed = JSON.parse(currentJson);
                        jsonObjects.push(JSON.stringify(parsed, null, 2));
                        currentJson = '';
                      } catch (e) {
                        // Keep original if parsing fails
                      }
                    }
                  }
                }
              }

              // If we found JSON objects, return them formatted
              if (jsonObjects.length > 0) {
                return jsonObjects.join('\n\n');
              }

              // Fallback: try to parse the entire line as JSON
              const parsed = JSON.parse(trimmedLine);
              return JSON.stringify(parsed, null, 2);
            } catch (e) {
              // If JSON parsing fails, return original line
              return line;
            }
          }
          return line;
        });

        return formattedLines.join('\n');
      } catch (error) {
        // If formatting fails, return original logs
        console.warn('Failed to format JSON logs:', error);
        return logs;
      }
    }

    return logs;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth withFullScreen>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {title} - Editor View
            {getLogLanguage() === 'json' && (
              <Typography component="span" variant="caption" color="primary.main" sx={{ ml: 1 }}>
                (Auto-formatted)
              </Typography>
            )}
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              size="small"
              startIcon={<Icon icon="mdi:content-copy" />}
              onClick={copyToClipboard}
              variant="outlined"
            >
              Copy
            </Button>
            <Button
              size="small"
              startIcon={<Icon icon="mdi:download" />}
              onClick={downloadLogs}
              variant="outlined"
            >
              Download
            </Button>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0, height: '70vh' }}>
        <Box height="100%">
          <Editor
            value={getFormattedLogs()}
            language={getLogLanguage()}
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
              folding: true, // Enable folding for large log blocks
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
              // Enable search functionality
              quickSuggestions: false,
              suggestOnTriggerCharacters: false,
              acceptSuggestionOnEnter: 'off',
              tabCompletion: 'off',
              wordBasedSuggestions: 'off',
              // Better performance for large logs
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
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogsDialog;
