import { Icon } from '@iconify/react';
import { Dialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Button, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useRef } from 'react';

interface LogsDialogProps {
  open: boolean;
  onClose: () => void;
  logs: string;
  title: string;
  resourceName?: string;
}

const LogsDialog: React.FC<LogsDialogProps> = ({ open, onClose, logs, title, resourceName }) => {
  const theme = useTheme();
  const terminalRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(logs);
    } catch (err) {
      console.error('Failed to copy logs to clipboard:', err);
    }
  };

  const downloadLogs = () => {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resourceName || 'resource'}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth withFullScreen>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{title}</Typography>
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
        <Box
          ref={terminalRef}
          sx={{
            height: '100%',
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f9fa',
            color: theme.palette.mode === 'dark' ? '#d4d4d4' : '#212529',
            fontFamily:
              'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
            fontSize: '13px',
            lineHeight: 1.4,
            padding: theme.spacing(2),
            overflowY: 'auto',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 0,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: theme.palette.mode === 'dark' ? '#2d2d30' : '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.mode === 'dark' ? '#464647' : '#c1c1c1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#5a5a5c' : '#a8a8a8',
            },
          }}
        >
          {logs || 'No logs available'}
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
