import { Alert, Box, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import type { DotnetMonitorProcess } from '../api/dotnetMonitor';

export interface ProcessSelectionValue {
  pid: number;
  uid?: string;
  name?: string;
}

export interface ProcessSelectorProps {
  processes: DotnetMonitorProcess[];
  selected?: ProcessSelectionValue | null;
  onSelect: (process: DotnetMonitorProcess) => void;
  loading?: boolean;
  error?: string | null;
}

export function getProcessKey(process: DotnetMonitorProcess): string {
  return process.uid ?? String(process.pid);
}

export function ProcessSelector({ processes, selected, onSelect, loading, error }: ProcessSelectorProps) {
  const selectedKey = selected ? selected.uid ?? String(selected.pid) : '';

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (loading) {
    return <Typography variant="body2">Loading processes...</Typography>;
  }

  if (processes.length === 0) {
    return <Alert severity="warning">No .NET processes were returned by dotnet-monitor.</Alert>;
  }

  return (
    <Stack spacing={2}>
      <Box>
        <FormControl fullWidth size="small">
          <InputLabel id="dotnet-monitor-process-select-label">Process</InputLabel>
          <Select
            labelId="dotnet-monitor-process-select-label"
            label="Process"
            value={selectedKey}
            onChange={(event) => {
              const process = processes.find((item) => getProcessKey(item) === event.target.value);
              if (process) {
                onSelect(process);
              }
            }}
          >
            {processes.map((process) => (
              <MenuItem key={getProcessKey(process)} value={getProcessKey(process)}>
                {process.name ? `${process.name} — PID ${process.pid}` : `PID ${process.pid}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

    </Stack>
  );
}
