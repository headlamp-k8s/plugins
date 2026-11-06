import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';

export interface ParsedStackFrame {
  text: string;
}

export interface ParsedStackThread {
  thread: string;
  frames: ParsedStackFrame[];
}

export interface StacksViewProps {
  rawStacks: string;
  threads: ParsedStackThread[];
  error?: string | null;
  loading?: boolean;
  onCopyRaw: () => void;
}

export function parseStacks(raw: string): ParsedStackThread[] {
  const threads: ParsedStackThread[] = [];
  let current: ParsedStackThread | null = null;

  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }
    const threadMatch = line.match(/^Thread:\s*(.+)$/);
    if (threadMatch) {
      current = { thread: threadMatch[1].trim(), frames: [] };
      threads.push(current);
      continue;
    }
    if (!current) {
      current = { thread: 'Unknown', frames: [] };
      threads.push(current);
    }
    current.frames.push({ text: line.trim() });
  }

  return threads;
}

export function StacksView({ rawStacks, threads, error, loading, onCopyRaw }: StacksViewProps) {
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (loading) {
    return <Typography variant="body2">Loading stacks...</Typography>;
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Typography variant="body2" color="text.secondary">
          {threads.length ? `${threads.length} thread stacks loaded.` : 'No stack data was returned.'}
        </Typography>
        <Button variant="outlined" size="small" onClick={onCopyRaw} disabled={!rawStacks}>
          Copy raw stacks
        </Button>
      </Stack>
      {threads.length === 0 ? (
        <Alert severity="info">The stack payload was empty or could not be parsed.</Alert>
      ) : (
        threads.slice(0, 10).map((thread, index) => (
          <Paper key={`${thread.thread}-${index}`} variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle2">{thread.thread}</Typography>
              <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                {thread.frames.slice(0, 30).map((frame) => frame.text).join('\n')}
              </Box>
            </Stack>
          </Paper>
        ))
      )}
      {rawStacks ? (
        <Box component="details">
          <Box component="summary" sx={{ cursor: 'pointer' }}>
            Raw payload
          </Box>
          <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
            {rawStacks}
          </Box>
        </Box>
      ) : null}
    </Stack>
  );
}

