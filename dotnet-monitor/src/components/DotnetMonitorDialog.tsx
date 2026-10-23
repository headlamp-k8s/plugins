import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import {
  Alert,
  Box,
  Button,
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
import { ProcessSelector, getProcessKey } from './ProcessSelector';
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

type TabKey = 'dumps' | 'trace' | 'metrics' | 'stacks' | 'exceptions' | 'logs' | 'info' | 'env';
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

interface PendingCapture {
  title: string;
  description: string;
  fileName: string;
  confirmLabel: string;
  run: () => Promise<void>;
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

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || error.message.toLowerCase().includes('aborted'))
  );
}

function assertNotAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DOMException('The operation was cancelled.', 'AbortError');
  }
}

function isFeatureDisabledError(detail: string): boolean {
  return /feature is not enabled/i.test(detail);
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
    case 'metrics':
      return 'Loading metrics...';
    case 'stacks':
      return 'Loading stacks...';
    case 'exceptions':
      return 'Loading exceptions...';
    case 'logs':
      return 'Loading logs...';
    case 'info':
      return 'Loading process info...';
    case 'env':
      return 'Loading environment...';
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

async function discoverProcesses(
  context: DotnetMonitorPodContext,
  containerName: string,
  currentSelectionKey?: string,
): Promise<{ processes: DotnetMonitorProcess[]; selected: DotnetMonitorProcess | null }> {
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
  const filtered = detailed.filter((process) => !isLikelyMonitorProcess(process));
  const selected =
    (currentSelectionKey
      ? filtered.find((process) => getProcessKey(process) === currentSelectionKey) ?? null
      : null) ?? pickBestProcess(filtered, containerName);
  return { processes: filtered, selected };
}

export function DotnetMonitorDialog({ open, onClose, context, containerName }: DotnetMonitorDialogProps) {
  const [tab, setTab] = useState<TabKey>('dumps');
  const [busy, setBusy] = useState<BusyAction>(null);
  const [error, setError] = useState<DialogError | null>(null);
  const [pendingCapture, setPendingCapture] = useState<PendingCapture | null>(null);
  const [processes, setProcesses] = useState<DotnetMonitorProcess[]>([]);
  const [selected, setSelected] = useState<DotnetMonitorProcess | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(30);
  const [profiles, setProfiles] = useState<string[]>(['Cpu', 'Http', 'Metrics']);
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
  const operationAbortRef = useRef<AbortController | null>(null);
  const operationIdRef = useRef(0);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setTab('dumps');
    setBusy('loading');
    setError(null);
    setPendingCapture(null);
    setProcesses([]);
    setSelected(null);
    setRuntimeInfo({});
    setMetrics({});
    setRuntimeLogs({});

    const load = async () => {
      try {
        const { processes: nextProcesses, selected: nextSelected } = await discoverProcesses(context, containerName);
        if (cancelled) {
          return;
        }
        setProcesses(nextProcesses);
        setSelected(nextSelected);
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

  const startOperation = async (
    operation: BusyAction,
    task: (signal: AbortSignal) => Promise<void>,
  ) => {
    const controller = new AbortController();
    const operationId = ++operationIdRef.current;
    operationAbortRef.current = controller;
    setBusy(operation);
    setError(null);
    try {
      await task(controller.signal);
    } catch (caught) {
      if (!controller.signal.aborted && !isAbortError(caught)) {
        setError(formatError(caught));
      }
    } finally {
      if (operationAbortRef.current === controller && operationIdRef.current === operationId) {
        operationAbortRef.current = null;
      }
      if (operationIdRef.current === operationId) {
        setBusy(null);
      }
    }
  };

  const selectedProcess = selected;

  const isBusy = busy !== null;
  const busyLabel = getBusyLabel(busy);
  const featureDisabledError = error && isFeatureDisabledError(error.detail) ? error.detail : null;
  const showTopLevelError =
    error !== null &&
    !featureDisabledError &&
    busy !== 'metrics' &&
    busy !== 'stacks' &&
    busy !== 'exceptions' &&
    busy !== 'logs' &&
    busy !== 'info' &&
    busy !== 'env';
  const cancelCapture = () => {
    operationAbortRef.current?.abort();
  };

  const refreshProcessSelection = async (): Promise<DotnetMonitorProcess | null> => {
    const currentSelectionKey = selectedProcess ? getProcessKey(selectedProcess) : undefined;
    const { processes: nextProcesses, selected: nextSelected } = await discoverProcesses(
      context,
      containerName,
      currentSelectionKey,
    );
    setProcesses(nextProcesses);
    setSelected(nextSelected);
    return nextSelected;
  };

  const handleMetrics = async () => {
    await startOperation('metrics', async (signal) => {
      const raw = await getMetrics(context, { timeoutMs: 20000, signal });
      if (signal.aborted) {
        return;
      }
      setMetrics({ raw, parsed: parsePrometheusMetrics(raw) });
      setError(null);
    });
  };

  const handleStacks = async () => {
    if (!selectedProcess) {
      return;
    }
    await startOperation('stacks', async (signal) => {
      const result = await getStacks(context, {
        pid: selectedProcess.pid,
        uid: selectedProcess.uid,
        name: selectedProcess.name,
        timeoutMs: 120000,
        signal,
      });
      if (signal.aborted) {
        return;
      }
      setRuntimeLogs((current) => ({ ...current, stacks: result, stackThreads: parseStacks(result) }));
      setError(null);
    });
  };

  const handleExceptions = async () => {
    if (!selectedProcess) {
      return;
    }
    await startOperation('exceptions', async (signal) => {
      const result = await getExceptions(context, {
        pid: selectedProcess.pid,
        uid: selectedProcess.uid,
        name: selectedProcess.name,
        timeoutMs: 120000,
        signal,
      });
      if (signal.aborted) {
        return;
      }
      setRuntimeLogs((current) => ({ ...current, exceptions: result, exceptionItems: parseExceptions(result) }));
      setError(null);
    });
  };

  const handleLogs = async () => {
    if (!selectedProcess) {
      return;
    }
    await startOperation('logs', async (signal) => {
      const result = await getLogs(context, {
        pid: selectedProcess.pid,
        uid: selectedProcess.uid,
        name: selectedProcess.name,
        level: 'Information',
        durationSeconds: 15,
        timeoutMs: 120000,
        signal,
      });
      if (signal.aborted) {
        return;
      }
      setRuntimeLogs((current) => ({ ...current, logs: result, logEntries: parseLogs(result) }));
      setError(null);
    });
  };

  const handleInfo = async () => {
    await startOperation('info', async (signal) => {
      const info = await getInfo(context, { timeoutMs: 20000, signal });
      if (signal.aborted) {
        return;
      }
      setRuntimeInfo((current) => ({ ...current, info: JSON.stringify(info, null, 2) }));
      setError(null);
    });
  };

  const handleEnvironment = async () => {
    if (!selectedProcess) {
      return;
    }
    await startOperation('env', async (signal) => {
      const env = await getProcessEnvironment(context, selectedProcess.pid, { timeoutMs: 20000, signal });
      if (signal.aborted) {
        return;
      }
      setRuntimeInfo((current) => ({ ...current, environment: JSON.stringify(env, null, 2) }));
      setError(null);
    });
  };

  const handleTabChange = async (_event: SyntheticEvent, value: TabKey) => {
    if (value !== tab) {
      operationAbortRef.current?.abort();
    }
    setTab(value);
    if (value === 'metrics') {
      void handleMetrics();
    } else if (value === 'stacks') {
      void handleStacks();
    } else if (value === 'exceptions') {
      void handleExceptions();
    } else if (value === 'logs') {
      void handleLogs();
    } else if (value === 'info') {
      void handleInfo();
    } else if (value === 'env') {
      void handleEnvironment();
    }
  };

  const closeIfNotBusy = () => {
    if (isBusy) {
      return;
    }
    onClose();
  };

  const handleDump = async (type: 'Full' | 'WithHeap' | 'Mini') => {
    const freshProcess = await refreshProcessSelection();
    if (!freshProcess) {
      setError({ title: 'dotnet-monitor request failed', detail: 'No .NET process is currently available. Refresh the dialog and try again.' });
      return;
    }
    const fileName = dumpFileName(context.podName, context.containerName, freshProcess.pid, type);
    setPendingCapture({
      title: `Start ${type === 'Full' ? 'full' : type === 'WithHeap' ? 'heap' : 'mini'} dump?`,
      description:
        'The dump will pause the target process while dotnet-monitor captures memory and writes the file back through the pod proxy.',
      fileName,
      confirmLabel: `Start ${type === 'Full' ? 'full' : type === 'WithHeap' ? 'heap' : 'mini'} dump`,
      run: async () => {
        await startOperation('dump', async (signal) => {
          const response = await startDump(context, {
            pid: freshProcess.pid,
            uid: freshProcess.uid,
            name: freshProcess.name,
            type,
            timeoutMs: type === 'Mini' ? 120000 : 180000,
            signal,
          });
          if (signal.aborted) {
            return;
          }
          assertNotAborted(signal);
          await downloadResponseAsFile(response, fileName);
        });
      },
    });
  };

  const handleGcdump = async () => {
    const freshProcess = await refreshProcessSelection();
    if (!freshProcess) {
      setError({ title: 'dotnet-monitor request failed', detail: 'No .NET process is currently available. Refresh the dialog and try again.' });
      return;
    }
    const fileName = gcdumpFileName(context.podName, context.containerName, freshProcess.pid);
    setPendingCapture({
      title: 'Start GC dump?',
      description:
        'The GC dump will collect managed heap data from the selected process and save it as a .gcdump file.',
      fileName,
      confirmLabel: 'Start GC dump',
      run: async () => {
        await startOperation('gcdump', async (signal) => {
          const response = await startGcdump(context, {
            pid: freshProcess.pid,
            uid: freshProcess.uid,
            name: freshProcess.name,
            timeoutMs: 240000,
            signal,
          });
          if (signal.aborted) {
            return;
          }
          assertNotAborted(signal);
          await downloadResponseAsFile(response, fileName);
        });
      },
    });
  };

  const handleTrace = async () => {
    const freshProcess = await refreshProcessSelection();
    if (!freshProcess) {
      setError({ title: 'dotnet-monitor request failed', detail: 'No .NET process is currently available. Refresh the dialog and try again.' });
      return;
    }
    const fileName = traceFileName(context.podName, context.containerName, freshProcess.pid);
    setPendingCapture({
      title: 'Start trace?',
      description:
        'The trace will record runtime events for the selected process and save the result as a .nettrace file.',
      fileName,
      confirmLabel: 'Start trace',
      run: async () => {
        await startOperation('trace', async (signal) => {
          const response = await startTrace(context, {
            pid: freshProcess.pid,
            uid: freshProcess.uid,
            name: freshProcess.name,
            profiles,
            durationSeconds,
            timeoutMs: Math.max(300000, (durationSeconds + 120) * 1000),
            signal,
          });
          if (signal.aborted) {
            return;
          }
          assertNotAborted(signal);
          await downloadResponseAsFile(response, fileName);
        });
      },
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
            {showTopLevelError ? <Alert severity="error">{error.detail}</Alert> : null}

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

            {selectedProcess ? null : (
              <Alert severity="info">Select a process to enable dump, trace, and runtime tabs.</Alert>
            )}

            <Divider />

            <Tabs
              value={tab}
              onChange={(_, value) => void handleTabChange(_, value as TabKey)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              <Tab value="dumps" label="Dumps" />
              <Tab value="trace" label="Trace" />
              <Tab value="metrics" label="Metrics" />
              <Tab value="stacks" label="Stacks" disabled={!selectedProcess} />
              <Tab value="exceptions" label="Exceptions" disabled={!selectedProcess} />
              <Tab value="logs" label="Logs" disabled={!selectedProcess} />
              <Tab value="info" label="Info" />
              <Tab value="env" label="Environment" disabled={!selectedProcess} />
            </Tabs>

            {tab === 'dumps' ? (
              <DumpActions
                selectedProcess={selectedProcess}
                busy={isBusy}
                loadingLabel={busyLabel}
                onCancel={busy === 'dump' || busy === 'gcdump' ? cancelCapture : undefined}
                onDump={handleDump}
                onGcdump={handleGcdump}
              />
            ) : null}

            {tab === 'trace' ? (
              <TraceActions
                selectedProcess={selectedProcess}
                busy={isBusy}
                loadingLabel={busyLabel}
                onCancel={busy === 'trace' ? cancelCapture : undefined}
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

            {tab === 'stacks' ? (
              <Stack spacing={2}>
                {runtimeLogs.stacks ? (
                  <StacksView
                    rawStacks={runtimeLogs.stacks}
                    threads={runtimeLogs.stackThreads ?? []}
                    loading={false}
                    onCopyRaw={async () => {
                      await navigator.clipboard.writeText(runtimeLogs.stacks ?? '');
                    }}
                  />
                ) : featureDisabledError ? (
                  <Alert severity="error">{featureDisabledError}</Alert>
                ) : (
                  <Alert severity="info">Stacks will appear here after loading.</Alert>
                )}
              </Stack>
            ) : null}

            {tab === 'exceptions' ? (
              <Stack spacing={2}>
                {runtimeLogs.exceptions ? (
                  <ExceptionsView
                    rawExceptions={runtimeLogs.exceptions}
                    items={runtimeLogs.exceptionItems ?? []}
                    error={featureDisabledError}
                    loading={false}
                    onCopyRaw={async () => {
                      await navigator.clipboard.writeText(runtimeLogs.exceptions ?? '');
                    }}
                  />
                ) : featureDisabledError ? (
                  <Alert severity="error">{featureDisabledError}</Alert>
                ) : (
                  <Alert severity="info">Exceptions will appear here after loading.</Alert>
                )}
              </Stack>
            ) : null}

            {tab === 'logs' ? (
              <Stack spacing={2}>
                {runtimeLogs.logs ? (
                  <LogsView
                    rawLogs={runtimeLogs.logs}
                    entries={runtimeLogs.logEntries ?? []}
                    error={featureDisabledError}
                    loading={busy === 'logs'}
                    onCopyRaw={async () => {
                      await navigator.clipboard.writeText(runtimeLogs.logs ?? '');
                    }}
                  />
                ) : featureDisabledError ? (
                  <Alert severity="error">{featureDisabledError}</Alert>
                ) : (
                  <Alert severity="info">Logs will appear here after loading.</Alert>
                )}
              </Stack>
            ) : null}

            {tab === 'info' ? (
              <Stack spacing={2}>
                {error ? <Alert severity="error">{error.detail}</Alert> : null}
                {runtimeInfo.info ? (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2">Monitor information</Typography>
                      <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                        {runtimeInfo.info}
                      </Box>
                    </Stack>
                  </Paper>
                ) : (
                  <Alert severity="info">Process information will appear here after loading.</Alert>
                )}
              </Stack>
            ) : null}

            {tab === 'env' ? (
              <Stack spacing={2}>
                {error ? <Alert severity="error">{error.detail}</Alert> : null}
                {runtimeInfo.environment ? (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2">Environment</Typography>
                      <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                        {runtimeInfo.environment}
                      </Box>
                    </Stack>
                  </Paper>
                ) : (
                  <Alert severity="info">Environment data will appear here after loading.</Alert>
                )}
              </Stack>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeIfNotBusy}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={pendingCapture !== null} onClose={() => setPendingCapture(null)}>
        <DialogTitle>{pendingCapture?.title ?? 'Confirm action'}</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            <Typography variant="body2">{pendingCapture?.description ?? ''}</Typography>
            <Typography variant="body2" color="text.secondary">
              Output file: {pendingCapture?.fileName ?? ''}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingCapture(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              const action = pendingCapture;
              setPendingCapture(null);
              if (action) {
                void action.run();
              }
            }}
            disabled={!pendingCapture || isBusy}
          >
            {pendingCapture?.confirmLabel ?? 'Start'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
