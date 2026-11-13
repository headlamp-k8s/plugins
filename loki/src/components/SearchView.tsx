import { ApiProxy, K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import {
  Datasource,
  defaults,
  Entry,
  errorMessage,
  INITIAL_LIMIT,
  MAX_LIMIT,
  Search,
  searchLogs,
  timestampLabel,
  validateDatasource,
} from '../api/loki';

const CONFIG_KEY = 'headlamp.loki.datasources.v1';
function readConfig(cluster: string): Datasource {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}')[cluster] };
  } catch {
    return { ...defaults };
  }
}
const fields: [keyof Datasource, string][] = [
  ['namespace', 'Gateway namespace'],
  ['service', 'Gateway Service'],
  ['port', 'Gateway port'],
  ['clusterValue', 'Stored cluster value'],
  ['clusterLabel', 'Cluster label'],
  ['namespaceLabel', 'Namespace label'],
  ['podLabel', 'Pod label'],
  ['containerLabel', 'Container label'],
];

export function HistoricalSearch({ cluster }: { cluster: string }) {
  const [config, setConfig] = useState(() => readConfig(cluster));
  const [saved, setSaved] = useState<Datasource | null>(null);
  const [range, setRange] = useState('60');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [namespace, setNamespace] = useState('');
  const [pod, setPod] = useState('');
  const [container, setContainer] = useState('');
  const [text, setText] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [snapshot, setSnapshot] = useState<Search | null>(null);
  const [limit, setLimit] = useState(INITIAL_LIMIT);
  const active = useRef<AbortController | null>(null);
  const serial = useRef(0);

  const cancel = () => {
    ++serial.current;
    active.current?.abort();
    active.current = null;
    setBusy(false);
  };
  useEffect(
    () => () => {
      ++serial.current;
      active.current?.abort();
    },
    []
  );
  const clear = () => {
    cancel();
    setEntries([]);
    setSnapshot(null);
    setError('');
    setMessage('');
  };
  async function run(test = false, older = false) {
    cancel();
    const id = serial.current;
    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 30000);
    active.current = controller;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      validateDatasource(config);
      if (
        !test &&
        !older &&
        range === 'absolute' &&
        ![start, end].every(value => /(?:Z|[+-]\d{2}:\d{2})$/.test(value))
      ) {
        throw new Error('Absolute timestamps must include Z or a timezone offset.');
      }
      const now = Date.now();
      const input: Search = test
        ? {
            namespace: namespace || 'default',
            pod: '',
            container: '',
            text: '',
            start: now - 60000,
            end: now,
          }
        : older && snapshot
        ? snapshot
        : {
            namespace,
            pod,
            container,
            text,
            start: range === 'absolute' ? Date.parse(start) : now - Number(range) * 60000,
            end: range === 'absolute' ? Date.parse(end) : now,
          };
      const nextLimit = test ? 1 : older ? Math.min(MAX_LIMIT, limit * 2) : INITIAL_LIMIT;
      const result = await searchLogs(
        (path, signal) =>
          ApiProxy.clusterRequest(path.slice(('/clusters/' + encodeURIComponent(cluster)).length), {
            cluster,
            method: 'GET',
            signal,
            autoLogoutOnAuthError: false,
          }),
        cluster,
        config,
        input,
        nextLimit,
        controller.signal
      );
      if (id !== serial.current) return;
      if (test) setMessage('Connection successful: Loki query API returned a valid response.');
      else {
        setEntries(result);
        setSnapshot(input);
        setLimit(nextLimit);
        setSaved({ ...config });
        setMessage(
          result.length
            ? 'Historical results loaded.'
            : 'No matching retained logs in this time range.'
        );
      }
    } catch (e) {
      if (id === serial.current && (!controller.signal.aborted || timedOut))
        setError(
          timedOut
            ? 'Historical log query timed out. Narrow the time range and retry.'
            : errorMessage(e)
        );
    } finally {
      clearTimeout(timeout);
      if (id === serial.current) {
        setBusy(false);
        active.current = null;
      }
    }
  }
  function save() {
    try {
      validateDatasource(config);
      const all = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
      localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...all, [cluster]: config }));
      clear();
      setMessage('Datasource saved for this cluster.');
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  const dirty = snapshot && saved && JSON.stringify(saved) !== JSON.stringify(config);
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Historical logs
      </Typography>
      <Typography paragraph>
        Search logs already collected and retained in Loki, including deleted Pods. Cluster:{' '}
        {cluster}
      </Typography>
      <Alert severity="info">
        Gateway permissions grant access to its configured tenant. Namespace filters are not access
        controls. This plugin stores no Loki credentials.
      </Alert>
      <Box component="details" my={2}>
        <summary>Datasource configuration</summary>
        <Stack spacing={2} mt={2}>
          {fields.map(([key, label]) => (
            <TextField
              key={key}
              label={label}
              value={config[key]}
              onChange={e => {
                clear();
                setConfig({ ...config, [key]: e.target.value });
              }}
            />
          ))}
          <Stack direction="row" spacing={2}>
            <Button onClick={save}>Save datasource</Button>
            <Button disabled={busy} onClick={() => run(true)}>
              Test connection
            </Button>
          </Stack>
        </Stack>
      </Box>
      <Stack spacing={2}>
        <TextField
          label="Exact namespace"
          required
          value={namespace}
          onChange={e => {
            clear();
            setNamespace(e.target.value);
          }}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Exact Pod name (optional)"
            value={pod}
            onChange={e => {
              clear();
              setPod(e.target.value);
            }}
            fullWidth
          />
          <TextField
            label="Exact container (optional)"
            value={container}
            onChange={e => {
              clear();
              setContainer(e.target.value);
            }}
            fullWidth
          />
        </Stack>
        <TextField
          label="Log text contains"
          value={text}
          onChange={e => {
            clear();
            setText(e.target.value);
          }}
        />
        <TextField
          select
          label="Time range"
          value={range}
          onChange={e => {
            clear();
            setRange(e.target.value);
          }}
        >
          {[
            ['15', 'Last 15 minutes'],
            ['60', 'Last hour'],
            ['1440', 'Last 24 hours'],
            ['absolute', 'Absolute range (UTC)'],
          ].map(([v, l]) => (
            <MenuItem key={v} value={v}>
              {l}
            </MenuItem>
          ))}
        </TextField>
        {range === 'absolute' && (
          <Stack direction="row" spacing={2}>
            <TextField
              label="Start (ISO 8601 with timezone)"
              placeholder="2026-11-13T10:00:00Z"
              value={start}
              onChange={e => {
                clear();
                setStart(e.target.value);
              }}
              fullWidth
            />
            <TextField
              label="End (ISO 8601 with timezone)"
              placeholder="2026-11-13T11:00:00Z"
              value={end}
              onChange={e => {
                clear();
                setEnd(e.target.value);
              }}
              fullWidth
            />
          </Stack>
        )}
        <Stack direction="row" spacing={2}>
          <Button variant="contained" disabled={busy || !namespace.trim()} onClick={() => run()}>
            Search
          </Button>
          {busy && (
            <>
              <CircularProgress size={24} />
              <Button onClick={cancel}>Cancel</Button>
            </>
          )}
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        {message && <Alert severity="info">{message}</Alert>}
        {snapshot && (
          <Typography variant="body2">
            {new Date(snapshot.start).toISOString()} — {new Date(snapshot.end).toISOString()}.
            Showing {entries.length} entries; request limit {limit}.
          </Typography>
        )}
        {entries.length >= limit && (
          <Alert severity="warning">
            Results may be truncated, including entries sharing the boundary timestamp. Load older
            expands the same fixed-window query without deduplicating messages. At 2,000 entries,
            narrow the time range to continue.
          </Alert>
        )}
        <Box
          role="log"
          aria-label="Historical log results"
          sx={{ maxHeight: 600, overflow: 'auto' }}
        >
          {entries.map((entry, i) => (
            <Box key={i} sx={{ borderBottom: 1, borderColor: 'divider', py: 1 }}>
              <Typography variant="caption">{timestampLabel(entry.timestamp)}</Typography>
              <Typography variant="caption" component="div" sx={{ overflowWrap: 'anywhere' }}>
                {JSON.stringify(entry.labels)}
              </Typography>
              <Box component="pre" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', m: 0 }}>
                {entry.line}
              </Box>
            </Box>
          ))}
        </Box>
        {snapshot && entries.length >= limit && (
          <Button disabled={busy || limit >= MAX_LIMIT || !!dirty} onClick={() => run(false, true)}>
            Load older logs
          </Button>
        )}
      </Stack>
    </Box>
  );
}

export default function SearchView() {
  const cluster = K8s.useCluster();
  return cluster ? (
    <HistoricalSearch key={cluster} cluster={cluster} />
  ) : (
    <Alert severity="info">Select a cluster to search historical logs.</Alert>
  );
}
