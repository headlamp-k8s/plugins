import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
  Paper,
} from '@mui/material';
import {
  downloadResponseAsFile,
  gcdumpFileName,
  getExceptions,
  getInfo,
  getLogs,
  getMetrics,
  getProcessEnvironment,
  getProcessInfo,
  getProcesses,
  getStacks,
  traceFileName,
  startDump,
  startGcdump,
  startTrace,
  type DotnetMonitorPodContext,
  type DotnetMonitorProcess,
} from '../api/dotnetMonitor';
import { dumpFileName } from '../api/dotnetMonitor';
import { DumpActions } from './DumpActions';
import { MetricsView, parsePrometheusMetrics, type ParsedMetricFamily } from './MetricsView';
import { ProcessSelector } from './ProcessSelector';
import { isLikelyMonitorProcess, pickBestProcess } from '../detection/processSelection';
import { TraceActions } from './TraceActions';
import { ExceptionsView, parseExceptions, type ParsedExceptionItem } from './ExceptionsView';
import { LogsView, parseLogs, type ParsedLogEntry } from './LogsView';
import { StacksView, parseStacks, type ParsedStackThread } from './StacksView';

export interface DotnetMonitorDialogProps {
  open: boolean;
  onClose: () => void;
  context: DotnetMonitorPodContext;
  containerName: string;
}

type TabKey = 'process' | 'dumps' | 'trace' | 'metrics' | 'runtime';
type BusyAction =
  | 'loading'
  | 'dump'
  | 'gcdump'
  | 'trace'
  | 'metrics'
  | 'stacks'
  | 'exceptions'
  | 'logs'
  | 'info'
  | 'env'
  | null;

interface DialogError {
  title: string;
  detail: string;
}

function formatError(error: unknown): DialogError {
  const rawDetail = error instanceof Error ? error.message : String(error);
  const proxyHint =
    rawDetail.includes('proxy error') || rawDetail.includes('502 Bad Gateway') || rawDetail.includes('Service Unavailable')
      ? '\n\nHint: dotnet-monitor must listen on the pod IP and expose the configured port. Check that the sidecar advertises the port you selected (default 52323) and that it binds to http://+:52323.'
      : '';
  return {
    title: 'dotnet-monitor request failed',
    detail: `${rawDetail}${proxyHint}`,
  };
}

function getBusyLabel(busy: BusyAction): string | null {
  switch (busy) {
    case 'loading':
      return 'Discovering processes through the Kubernetes pod proxy...';
    case 'dump':
      return 'Generating dump and downloading the .dmp file...';
    case 'gcdump':
      return 'Generating GC dump and downloading the .gcdump file...';
    case 'trace':
      return 'Recording trace and downloading the .nettrace file...';
    default:
      return null;
  }
}

function getProcessDisplayName(process: DotnetMonitorProcess): string {
  if (process.name) {
    return process.name;
  }
  if (process.managedEntryPointAssemblyName) {
    return process.managedEntryPointAssemblyName;
  }
  return `PID ${process.pid}`;
}

async function fetchProcessDetails(
  context: DotnetMonitorPodContext,
  process: DotnetMonitorProcess,
  apiKey?: string,
): Promise<DotnetMonitorProcess> {
  const detailed = await getProcessInfo(context, process.pid, { apiKey, timeoutMs: 20000 });
  return detailed ?? process;
}

export function DotnetMonitorDialog({ open, onClose, context, containerName }: DotnetMonitorDialogProps) {
  const [tab, setTab] = useState<TabKey>('process');
  const [busy, setBusy] = useState<BusyAction>(null);
  const [error, setError] = useState<DialogError | null>(null);
  const [processes, setProcesses] = useState<DotnetMonitorProcess[]>([]);
  const [selected, setSelected] = useState<DotnetMonitorProcess | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(30);
  const [profiles, setProfiles] = useState<string[]>(['Cpu', 'Http', 'Metrics']);
  const [pendingFullDump, setPendingFullDump] = useState(false);
  const [runtimeInfo, setRuntimeInfo] = useState<{ info?: string | null; environment?: string | null }>({});
  const [metrics, setMetrics] = useState<{ raw?: string | null; parsed?: ParsedMetricFamily[] }>({});
  const [runtimeLogs, setRuntimeLogs] = useState<{
    stacks?: string | null;
    stackThreads?: ParsedStackThread[];
    exceptions?: string | null;
    exceptionItems?: ParsedExceptionItem[];
    logs?: string | null;
    logEntries?: ParsedLogEntry[];
  }>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setBusy('loading');
    setError(null);
    setProcesses([]);
    setSelected(null);
    setRuntimeInfo({});
    setMetrics({});
    setRuntimeLogs({});

    const load = async () => {
      try {
        const discovered = await getProcesses(context, { timeoutMs: 20000 });
        const detailed = await Promise.all(
          discovered.map(async (process) => {
            try {
              return await fetchProcessDetails(context, process);
            } catch {
              return process;
            }
          }),
        );
        if (cancelled) {
          return;
        }
        const filtered = detailed.filter((process) => !isLikelyMonitorProcess(process));
        const best = pickBestProcess(filtered, containerName);
        setProcesses(filtered);
        setSelected(best);
        setBusy(null);
      } catch (caught) {
        if (cancelled) {
          return;
        }
        setBusy(null);
        setError(formatError(caught));
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [containerName, context, open]);

  useEffect(() => {
    if (!open || !selected) {
      return;
    }
    setProfiles((current) => (current.length === 0 ? ['Cpu', 'Http', 'Metrics'] : current));
  }, [open, selected]);

  const startOperation = async (operation: BusyAction, task: () => Promise<void>) => {
    setBusy(operation);
    setError(null);
    try {
      await task();
    } catch (caught) {
      setError(formatError(caught));
    } finally {
      setBusy(null);
    }
  };

  const selectedProcess = selected;

  const isBusy = busy !== null;
  const busyLabel = getBusyLabel(busy);

  const closeIfNotBusy = () => {
    if (isBusy) {
      return;
    }
    onClose();
  };

  const handleDump = async (type: 'Full' | 'WithHeap' | 'Mini') => {
    if (!selectedProcess) {
      return;
    }
    if (type === 'Full') {
      setPendingFullDump(true);
      return;
    }
    await startOperation('dump', async () => {
      const response = await startDump(context, {
        pid: selectedProcess.pid,
        uid: selectedProcess.uid,
        name: selectedProcess.name,
        type,
        timeoutMs: type === 'Mini' ? 120000 : 180000,
      });
      await downloadResponseAsFile(
        response,
        dumpFileName(context.podName, context.containerName, selectedProcess.pid, type),
      );
    });
  };

  const confirmFullDump = async () => {
    if (!selectedProcess) {
      return;
    }
    setPendingFullDump(false);
    await startOperation('dump', async () => {
      const response = await startDump(context, {
        pid: selectedProcess.pid,
        uid: selectedProcess.uid,
        name: selectedProcess.name,
        type: 'Full',
        timeoutMs: 300000,
      });
      await downloadResponseAsFile(response, dumpFileName(context.podName, context.containerName, selectedProcess.pid, 'Full'));
    });
  };

  const handleGcdump = async () => {
    if (!selectedProcess) {
      return;
    }
    await startOperation('gcdump', async () => {
      const response = await startGcdump(context, {
        pid: selectedProcess.pid,
        uid: selectedProcess.uid,
        name: selectedProcess.name,
        timeoutMs: 240000,
      });
      await downloadResponseAsFile(response, gcdumpFileName(context.podName, context.containerName, selectedProcess.pid));
    });
  };

  const handleTrace = async () => {
    if (!selectedProcess) {
      return;
    }
    await startOperation('trace', async () => {
      const response = await startTrace(context, {
        pid: selectedProcess.pid,
        uid: selectedProcess.uid,
        name: selectedProcess.name,
        profiles,
        durationSeconds,
        timeoutMs: Math.max(300000, (durationSeconds + 120) * 1000),
      });
      await downloadResponseAsFile(response, traceFileName(context.podName, context.containerName, selectedProcess.pid));
    });
  };

  const handleMetrics = async () => {
    await startOperation('metrics', async () => {
      const raw = await getMetrics(context, { timeoutMs: 20000 });
      setMetrics({ raw, parsed: parsePrometheusMetrics(raw) });
      setTab('metrics');
    });
  };

  const handleRuntimeAction = async (action: 'stacks' | 'exceptions' | 'logs' | 'info' | 'env') => {
    if (!selectedProcess) {
      return;
    }
    await startOperation(action, async () => {
      if (action === 'stacks') {
        const result = await getStacks(context, {
          pid: selectedProcess.pid,
          uid: selectedProcess.uid,
          name: selectedProcess.name,
          timeoutMs: 120000,
        });
        setRuntimeLogs((current) => ({ ...current, stacks: result, stackThreads: parseStacks(result) }));
        setTab('runtime');
      } else if (action === 'exceptions') {
        const result = await getExceptions(context, {
          pid: selectedProcess.pid,
          uid: selectedProcess.uid,
          name: selectedProcess.name,
          timeoutMs: 120000,
        });
        setRuntimeLogs((current) => ({ ...current, exceptions: result, exceptionItems: parseExceptions(result) }));
        setTab('runtime');
      } else if (action === 'logs') {
        const result = await getLogs(context, {
          pid: selectedProcess.pid,
          uid: selectedProcess.uid,
          name: selectedProcess.name,
          level: 'Information',
          durationSeconds: 15,
          timeoutMs: 120000,
        });
        setRuntimeLogs((current) => ({ ...current, logs: result, logEntries: parseLogs(result) }));
        setTab('runtime');
      } else if (action === 'info') {
        const info = await getInfo(context, { timeoutMs: 20000 });
        setRuntimeInfo((current) => ({ ...current, info: JSON.stringify(info, null, 2) }));
        setTab('runtime');
      } else if (action === 'env') {
        const env = await getProcessEnvironment(context, selectedProcess.pid, { timeoutMs: 20000 });
        setRuntimeInfo((current) => ({ ...current, environment: JSON.stringify(env, null, 2) }));
        setTab('runtime');
      }
    });
  };

  return (
    <>
      <Dialog open={open} onClose={closeIfNotBusy} maxWidth="lg" fullWidth>
        <DialogTitle>
          .NET Monitor - {context.podName} / {containerName}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {error ? <Alert severity="error">{error.detail}</Alert> : null}
            {busyLabel ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2">{busyLabel}</Typography>
              </Stack>
            ) : null}

            <Typography variant="body2" color="text.secondary">
              Linux PIDs and runtime IDs change after container restarts. This dialog always refreshes the process
              list when it opens.
            </Typography>

            <ProcessSelector
              processes={processes}
              selected={selected ? { pid: selected.pid, uid: selected.uid, name: selected.name } : null}
              onSelect={setSelected}
              loading={busy === 'loading'}
            />

            <Divider />

            <Tabs value={tab} onChange={(_, value) => setTab(value)}>
              <Tab value="process" label="Process" />
              <Tab value="dumps" label="Dumps" />
              <Tab value="trace" label="Trace" />
              <Tab value="metrics" label="Metrics" />
              <Tab value="runtime" label="Runtime" />
            </Tabs>

            {tab === 'process' ? (
              <Stack spacing={2}>
                <Typography variant="subtitle2">Selected process</Typography>
                <Typography variant="body2">{selected ? getProcessDisplayName(selected) : 'No process selected'}</Typography>
                {selected?.commandLine ? (
                  <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                    {selected.commandLine}
                  </Box>
                ) : null}
              </Stack>
            ) : null}

            {tab === 'dumps' ? (
            <DumpActions
              selectedProcess={selectedProcess}
              busy={isBusy}
              loadingLabel={busyLabel}
              onDump={handleDump}
              onGcdump={handleGcdump}
            />
          ) : null}

            {tab === 'trace' ? (
            <TraceActions
              selectedProcess={selectedProcess}
              busy={isBusy}
              loadingLabel={busyLabel}
              durationSeconds={durationSeconds}
              profiles={profiles}
              onDurationChange={setDurationSeconds}
                onProfilesChange={setProfiles}
                onStartTrace={handleTrace}
              />
            ) : null}

            {tab === 'metrics' ? (
              <MetricsView
                rawMetrics={metrics.raw ?? ''}
                parsedMetrics={metrics.parsed ?? []}
                loading={busy === 'metrics'}
                error={error?.detail ?? null}
                onCopyRaw={async () => {
                  if (metrics.raw) {
                    await navigator.clipboard.writeText(metrics.raw);
                  }
                }}
              />
            ) : null}

            {tab === 'runtime' ? (
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Runtime actions below use the selected process. Expensive or sensitive operations should be used
                  carefully.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button size="small" variant="outlined" onClick={() => void handleRuntimeAction('stacks')} disabled={!selectedProcess || isBusy}>
                    Stacks
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => void handleRuntimeAction('exceptions')} disabled={!selectedProcess || isBusy}>
                    Exceptions
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => void handleRuntimeAction('logs')} disabled={!selectedProcess || isBusy}>
                    Logs
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => void handleRuntimeAction('info')} disabled={isBusy}>
                    Process info
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => void handleRuntimeAction('env')} disabled={!selectedProcess || isBusy}>
                    Environment
                  </Button>
                </Stack>
                <Stack spacing={2}>
                  {runtimeInfo.info ? (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={1}>
                        <Typography variant="subtitle2">Monitor information</Typography>
                        <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                          {runtimeInfo.info}
                        </Box>
                      </Stack>
                    </Paper>
                  ) : null}
                  {runtimeInfo.environment ? (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={1}>
                        <Typography variant="subtitle2">Environment</Typography>
                        <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                          {runtimeInfo.environment}
                        </Box>
                      </Stack>
                    </Paper>
                  ) : null}
                  {runtimeLogs.stacks ? (
                    <StacksView
                      rawStacks={runtimeLogs.stacks}
                      threads={runtimeLogs.stackThreads ?? []}
                      loading={false}
                      onCopyRaw={async () => {
                        await navigator.clipboard.writeText(runtimeLogs.stacks ?? '');
                      }}
                    />
                  ) : null}
                  {runtimeLogs.exceptions ? (
                    <ExceptionsView
                      rawExceptions={runtimeLogs.exceptions}
                      items={runtimeLogs.exceptionItems ?? []}
                      loading={false}
                      onCopyRaw={async () => {
                        await navigator.clipboard.writeText(runtimeLogs.exceptions ?? '');
                      }}
                    />
                  ) : null}
                  {runtimeLogs.logs ? (
                    <LogsView
                      rawLogs={runtimeLogs.logs}
                      entries={runtimeLogs.logEntries ?? []}
                      loading={false}
                      onCopyRaw={async () => {
                        await navigator.clipboard.writeText(runtimeLogs.logs ?? '');
                      }}
                    />
                  ) : null}
                </Stack>
              </Stack>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeIfNotBusy}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={pendingFullDump} onClose={() => setPendingFullDump(false)}>
        <DialogTitle>Confirm full dump</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Full dumps can be large and resource intensive. They can also contain secrets, tokens, and user data.
            Continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingFullDump(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={() => void confirmFullDump()} disabled={!selectedProcess || isBusy}>
            Start full dump
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
