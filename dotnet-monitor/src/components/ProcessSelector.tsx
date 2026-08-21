import { Alert, Box, Chip, FormControl, InputLabel, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
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

function formatRuntime(process: DotnetMonitorProcess): string {
  if (process.managedEntryPointAssemblyName) {
    return process.managedEntryPointAssemblyName;
  }
  if (process.operatingSystem || process.processArchitecture) {
    return [process.operatingSystem, process.processArchitecture].filter(Boolean).join(' ');
  }
  return '.NET process';
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
        <Typography variant="subtitle2" gutterBottom>
          Selected process
        </Typography>
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

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>PID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Runtime</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {processes.map((process) => {
            const key = getProcessKey(process);
            const active = key === selectedKey;
            return (
              <TableRow
                key={key}
                hover
                selected={active}
                onClick={() => onSelect(process)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" fontWeight={active ? 700 : 400}>
                      {process.pid}
                    </Typography>
                    {active ? <Chip size="small" label="Selected" color="primary" /> : null}
                  </Stack>
                </TableCell>
                <TableCell>{process.name ?? 'Unknown'}</TableCell>
                <TableCell>{formatRuntime(process)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Stack>
  );
}

