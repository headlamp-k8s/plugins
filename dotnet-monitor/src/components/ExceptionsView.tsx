import { Alert, Box, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

export interface ParsedExceptionFrame {
  methodName?: string;
  typeName?: string;
  moduleName?: string;
}

export interface ParsedExceptionItem {
  id?: number;
  timestamp?: string;
  typeName?: string;
  moduleName?: string;
  message?: string;
  stackText?: string;
  raw: string;
}

export interface ExceptionsViewProps {
  rawExceptions: string;
  items: ParsedExceptionItem[];
  error?: string | null;
  loading?: boolean;
  onCopyRaw: () => void;
}

export function parseExceptions(raw: string): ParsedExceptionItem[] {
  const items: ParsedExceptionItem[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      items.push({
        id: typeof parsed.id === 'number' ? parsed.id : undefined,
        timestamp: typeof parsed.timestamp === 'string' ? parsed.timestamp : undefined,
        typeName: typeof parsed.typeName === 'string' ? parsed.typeName : undefined,
        moduleName: typeof parsed.moduleName === 'string' ? parsed.moduleName : undefined,
        message: typeof parsed.message === 'string' ? parsed.message : undefined,
        stackText: parsed.stack ? JSON.stringify(parsed.stack, null, 2) : undefined,
        raw: trimmed,
      });
    } catch {
      items.push({ raw: trimmed, message: trimmed });
    }
  }
  return items;
}

export function ExceptionsView({ rawExceptions, items, error, loading, onCopyRaw }: ExceptionsViewProps) {
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (loading) {
    return <Typography variant="body2">Loading exceptions...</Typography>;
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Typography variant="body2" color="text.secondary">
          {items.length ? `${items.length} exception records loaded.` : 'No exception data was returned.'}
        </Typography>
        <Button variant="outlined" size="small" onClick={onCopyRaw} disabled={!rawExceptions}>
          Copy raw exceptions
        </Button>
      </Stack>
      {items.length === 0 ? (
        <Alert severity="info">The exceptions payload was empty or could not be parsed.</Alert>
      ) : (
        <Paper variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.slice(0, 50).map((item, index) => (
                <TableRow key={`${item.id ?? 'exc'}-${index}`}>
                  <TableCell>{item.id ?? 'n/a'}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.timestamp ?? 'n/a'}</TableCell>
                  <TableCell>{item.typeName ?? item.moduleName ?? 'n/a'}</TableCell>
                  <TableCell>
                    <Stack spacing={1}>
                      <Typography variant="body2">{item.message ?? 'n/a'}</Typography>
                      {item.stackText ? (
                        <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                          {item.stackText}
                        </Box>
                      ) : null}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
      {rawExceptions ? (
        <Box component="details">
          <Box component="summary" sx={{ cursor: 'pointer' }}>
            Raw payload
          </Box>
          <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
            {rawExceptions}
          </Box>
        </Box>
      ) : null}
    </Stack>
  );
}

