import { Icon } from '@iconify/react';
import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Paper,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { fetchLogs } from '../utils/LogsHelper';

interface LogsDisplayProps {
  namespace: string;
  podName: string;
  containerName?: string;
  initialLines?: number;
  height?: string | number;
  onError?: (error: Error) => void;
}

export default function LogsDisplay({
  namespace,
  podName,
  containerName,
  initialLines = 100,
  height = '400px',
  onError,
}: LogsDisplayProps) {
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tailLines, setTailLines] = useState(initialLines);
  const [showPrevious, setShowPrevious] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLogData = async () => {
    setLoading(true);
    setError(null);

    try {
      const logData = await fetchLogs(namespace, podName, containerName, tailLines, showPrevious);
      setLogs(logData);

      // Scroll to bottom
      setTimeout(() => {
        if (logsEndRef.current) {
          logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch logs';
      setError(errorMessage);
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle auto-refresh
  useEffect(() => {
    if (autoRefresh && !showPrevious) {
      intervalRef.current = setInterval(fetchLogData, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, showPrevious, tailLines, containerName, namespace, podName]);

  // Initial fetch
  useEffect(() => {
    fetchLogData();
  }, [tailLines, showPrevious, containerName, namespace, podName]);

  // Format logs for better readability
  const formattedLogs = logs
    ? logs.split('\n').map((line, index) => {
        // Try to highlight timestamps and log levels
        const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z)/);

        if (timestampMatch) {
          const timestamp = timestampMatch[1];
          const restOfLine = line.substring(timestamp.length);

          // Highlight error and warning messages
          let messageClass = '';
          if (restOfLine.toLowerCase().includes('error') || restOfLine.includes('ERR')) {
            messageClass = 'error';
          } else if (restOfLine.toLowerCase().includes('warn') || restOfLine.includes('WARN')) {
            messageClass = 'warning';
          }

          return (
            <div key={index} className={messageClass}>
              <span style={{ color: '#888', fontSize: '0.85em' }}>{timestamp}</span>
              <span>{restOfLine}</span>
            </div>
          );
        }

        return <div key={index}>{line}</div>;
      })
    : [];

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" component="div">
          Logs: {podName}
          {containerName && ` / ${containerName}`}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            size="small"
            label="Lines"
            type="number"
            value={tailLines}
            onChange={e => setTailLines(parseInt(e.target.value) || 10)}
            InputProps={{ inputProps: { min: 1, max: 10000 } }}
            sx={{ width: '100px' }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={showPrevious}
                onChange={e => setShowPrevious(e.target.checked)}
                size="small"
              />
            }
            label="Previous"
          />

          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                disabled={showPrevious}
                size="small"
              />
            }
            label="Auto-refresh"
          />

          <Button
            variant="outlined"
            size="small"
            startIcon={<Icon icon="mdi:refresh" />}
            onClick={fetchLogData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          width: '100%',
          height,
          overflow: 'auto',
          bgcolor: theme => (theme.palette.mode === 'dark' ? '#1e1e2f' : '#f5f5f5'),
          p: 1,
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          position: 'relative',
        }}
      >
        {loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0,0,0,0.1)',
              zIndex: 1,
            }}
          >
            <CircularProgress size={40} />
          </Box>
        )}

        {error ? (
          <Box sx={{ color: 'error.main', p: 2 }}>
            <Typography variant="body2" component="div">
              Error loading logs: {error}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {formattedLogs}
            <div ref={logsEndRef} />
          </Box>
        )}
      </Paper>
    </Box>
  );
}
