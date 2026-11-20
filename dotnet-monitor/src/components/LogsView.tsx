import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';

export interface ParsedLogEntry {
  timestamp?: string;
  level?: string;
  category?: string;
  eventId?: string;
  message?: string;
  exception?: string;
  raw: string;
}

export interface LogsViewProps {
  rawLogs: string;
  entries: ParsedLogEntry[];
  error?: string | null;
  loading?: boolean;
  onCopyRaw: () => void;
}

export function parseLogs(raw: string): ParsedLogEntry[] {
  const entries: ParsedLogEntry[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      entries.push({
        timestamp: typeof parsed.Timestamp === 'string' ? parsed.Timestamp : undefined,
        level: typeof parsed.LogLevel === 'string' ? parsed.LogLevel : undefined,
        category: typeof parsed.Category === 'string' ? parsed.Category : undefined,
        eventId: typeof parsed.EventId === 'string' ? parsed.EventId : undefined,
        message: typeof parsed.Message === 'string' ? parsed.Message : undefined,
        exception: typeof parsed.Exception === 'string' ? parsed.Exception : undefined,
        raw: trimmed,
      });
    } catch {
      entries.push({ raw: trimmed, message: trimmed });
    }
  }
  return entries;
}

export function LogsView({ rawLogs, entries, error, loading, onCopyRaw }: LogsViewProps) {
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (loading) {
    return <Typography variant="body2">Loading logs...</Typography>;
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Typography variant="body2" color="text.secondary">
          {entries.length ? `${entries.length} log entries loaded.` : 'No log entries were returned.'}
        </Typography>
        <Button variant="outlined" size="small" onClick={onCopyRaw} disabled={!rawLogs}>
          Copy raw logs
        </Button>
      </Stack>
      {entries.length === 0 ? (
        <Alert severity="info">The logs payload was empty or could not be parsed.</Alert>
      ) : (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1}>
            {entries.slice(0, 50).map((entry, index) => (
              <Box
                key={`${entry.timestamp ?? 'log'}-${index}`}
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontSize: 13,
                  lineHeight: 1.5,
                  '& + &': {
                    mt: 1,
                    pt: 1,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  },
                }}
              >
                {entry.message ?? entry.raw}
              </Box>
            ))}
          </Stack>
        </Paper>
      )}
      {rawLogs ? (
        <Box component="details">
          <Box component="summary" sx={{ cursor: 'pointer' }}>
            Raw payload
          </Box>
          <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
            {rawLogs}
          </Box>
        </Box>
      ) : null}
    </Stack>
  );
}
