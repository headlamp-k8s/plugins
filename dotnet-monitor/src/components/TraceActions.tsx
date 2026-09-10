import {
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { DotnetMonitorProcess } from '../api/dotnetMonitor';

export const TRACE_PROFILE_OPTIONS = ['Cpu', 'Http', 'Logs', 'Metrics', 'GcCollect'] as const;

export interface TraceActionsProps {
  selectedProcess: DotnetMonitorProcess | null;
  busy?: boolean;
  loadingLabel?: string | null;
  onCancel?: () => void;
  durationSeconds: number;
  profiles: string[];
  onDurationChange: (value: number) => void;
  onProfilesChange: (value: string[]) => void;
  onStartTrace: () => void;
}

export function TraceActions({
  selectedProcess,
  busy,
  loadingLabel,
  onCancel,
  durationSeconds,
  profiles,
  onDurationChange,
  onProfilesChange,
  onStartTrace,
}: TraceActionsProps) {
  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        dotnet-monitor traces are downloaded as `.nettrace` files.
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
      <TextField
        label="Duration (seconds)"
        type="number"
        size="small"
        value={durationSeconds}
        onChange={(event) => onDurationChange(Number(event.target.value))}
        inputProps={{ min: 1, step: 1 }}
      />
      <FormControl size="small">
        <InputLabel id="dotnet-monitor-trace-profile-label">Profiles</InputLabel>
        <Select
          multiple
          labelId="dotnet-monitor-trace-profile-label"
          label="Profiles"
          value={profiles}
          onChange={(event) => {
            const value = event.target.value;
            onProfilesChange(typeof value === 'string' ? value.split(',') : value);
          }}
        >
          {TRACE_PROFILE_OPTIONS.map((profile) => (
            <MenuItem key={profile} value={profile}>
              {profile}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button variant="contained" size="small" onClick={onStartTrace} disabled={!selectedProcess || busy}>
        Start trace
      </Button>
    </Stack>
  );
}
