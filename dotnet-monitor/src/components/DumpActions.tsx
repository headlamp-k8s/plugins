import { Button, ButtonGroup, CircularProgress, Stack, Typography } from '@mui/material';
import type { DotnetMonitorProcess } from '../api/dotnetMonitor';

export interface DumpActionsProps {
  selectedProcess: DotnetMonitorProcess | null;
  busy?: boolean;
  loadingLabel?: string | null;
  onCancel?: () => void;
  onDump: (type: 'Full' | 'WithHeap' | 'Mini') => void;
  onGcdump: () => void;
}

export function DumpActions({ selectedProcess, busy, loadingLabel, onCancel, onDump, onGcdump }: DumpActionsProps) {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Dumps may contain secrets, tokens, connection strings, and user data.
      </Typography>
      {busy && loadingLabel ? (
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap">
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={16} />
            <Typography variant="body2">{loadingLabel}</Typography>
          </Stack>
          {onCancel ? (
            <Button size="small" variant="outlined" color="error" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </Stack>
      ) : null}
      <ButtonGroup variant="outlined" size="small" disabled={!selectedProcess || busy}>
        <Button onClick={() => onDump('Full')}>Full dump</Button>
        <Button onClick={() => onDump('WithHeap')}>Heap dump</Button>
        <Button onClick={() => onDump('Mini')}>Mini dump</Button>
        <Button onClick={onGcdump}>GC dump</Button>
      </ButtonGroup>
    </Stack>
  );
}
