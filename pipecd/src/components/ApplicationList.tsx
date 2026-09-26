import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { isConfigured, listApplications, loadConfig, PipeCDApiError } from '../api/pipecd';
import type { Application, ApplicationKind } from '../types/pipecd';
import { KindBadge } from './KindBadge';
import { NotConfigured } from './NotConfigured';
import { SyncStatusLabel } from './SyncStatusLabel';

function formatTimestamp(unix: number | undefined): string {
  if (!unix || unix === 0) return '—';
  return new Date(unix * 1000).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function relativeTime(unix: number | undefined): string {
  if (!unix || unix === 0) return '—';
  const diffMs = Date.now() - unix * 1000;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

const MAX_DESCRIPTION_LENGTH = 90;

function summarizeDescription(description: string): string {
  const plain = description
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // markdown links -> link text only
    .replace(/\\\s*\n/g, ' ') // markdown backslash line-continuations
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > MAX_DESCRIPTION_LENGTH
    ? `${plain.slice(0, MAX_DESCRIPTION_LENGTH)}…`
    : plain;
}

function LoadingSkeleton(): JSX.Element {
  return (
    <Table aria-label="loading-skeleton">
      <TableHead>
        <TableRow>
          {['Name', 'Kind', 'Sync Status', 'Last Deployed', 'Git Path'].map(h => (
            <TableCell key={h}>
              <strong>{h}</strong>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            {Array.from({ length: 5 }).map((__, j) => (
              <TableCell key={j}>
                <Skeleton variant="text" width={j === 0 ? 160 : 100} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const ALL_KINDS: ApplicationKind[] = ['KUBERNETES', 'TERRAFORM', 'CLOUD_RUN', 'LAMBDA', 'ECS'];

export function ApplicationList(): JSX.Element {
  const config = loadConfig();

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const [kindFilter, setKindFilter] = useState<ApplicationKind | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const fetchApps = useCallback(
    async (signal?: AbortSignal) => {
      if (!isConfigured(config)) return;
      setLoading(true);
      setError(null);
      try {
        const resp = await listApplications(config, {
          kind: kindFilter !== 'ALL' ? kindFilter : undefined,
          signal,
        });
        setApps(resp.applications ?? []);
        setLastFetched(new Date());
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (err instanceof PipeCDApiError) {
          setError(`API error ${err.status}: ${err.message}`);
        } else {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.baseURL, config.apiKey, kindFilter]
  );

  useEffect(() => {
    if (!isConfigured(config)) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    void fetchApps(controller.signal);
    return () => controller.abort();
  }, [fetchApps, config.baseURL, config.apiKey]);

  if (!isConfigured(config)) {
    return <NotConfigured />;
  }

  const filtered = apps.filter(app => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      app.name.toLowerCase().includes(q) ||
      app.gitPath?.repo?.id?.toLowerCase().includes(q) ||
      app.gitPath?.path?.toLowerCase().includes(q)
    );
  });

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
        flexWrap="wrap"
        gap={1}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            PipeCD Applications
          </Typography>
          {lastFetched && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastFetched.toLocaleTimeString()}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="kind-filter-label">Platform</InputLabel>
            <Select
              labelId="kind-filter-label"
              id="kind-filter"
              value={kindFilter}
              label="Platform"
              onChange={e => setKindFilter(e.target.value as ApplicationKind | 'ALL')}
            >
              <MenuItem value="ALL">All</MenuItem>
              {ALL_KINDS.map(k => (
                <MenuItem key={k} value={k}>
                  {k}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            id="app-search"
            size="small"
            placeholder="Search by name or repo…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ minWidth: 220 }}
          />

          <Tooltip title="Refresh">
            <span>
              <Button
                variant="outlined"
                size="small"
                onClick={() => void fetchApps()}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={14} /> : undefined}
              >
                Refresh
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          <strong>Failed to load applications</strong>
          <br />
          {error}
        </Alert>
      )}

      {loading && <LoadingSkeleton />}

      {!loading && !error && filtered.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography color="text.secondary" mb={1}>
            {apps.length === 0
              ? 'No PipeCD applications found.'
              : 'No applications match the current filter.'}
          </Typography>
          {apps.length === 0 && (
            <Typography variant="caption" color="text.secondary">
              Make sure your PipeCD project has at least one application registered.
            </Typography>
          )}
        </Box>
      )}

      {!loading && filtered.length > 0 && (
        <Table aria-label="pipecd-applications-table" sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
          <TableHead>
            <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: 700 } }}>
              <TableCell>Name</TableCell>
              <TableCell>Platform</TableCell>
              <TableCell>Sync Status</TableCell>
              <TableCell>Last Synced</TableCell>
              <TableCell>Repository</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(app => (
              <TableRow key={app.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {app.name}
                  </Typography>
                  {app.description && (
                    <Tooltip title={app.description.replace(/\\\s*\n/g, ' ')} arrow>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        display="block"
                        maxWidth={360}
                      >
                        {summarizeDescription(app.description)}
                      </Typography>
                    </Tooltip>
                  )}
                </TableCell>

                <TableCell>
                  <KindBadge kind={app.kind} />
                </TableCell>

                <TableCell>
                  <Tooltip title={app.syncState?.shortReason ?? ''} arrow>
                    <span>
                      <SyncStatusLabel status={app.syncState?.status} />
                    </span>
                  </Tooltip>
                </TableCell>

                <TableCell>
                  <Tooltip
                    title={formatTimestamp(app.mostRecentSuccessfulDeployment?.completedAt)}
                    arrow
                  >
                    <Typography variant="body2">
                      {relativeTime(app.mostRecentSuccessfulDeployment?.completedAt)}
                    </Typography>
                  </Tooltip>
                  {app.mostRecentSuccessfulDeployment?.summary && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {app.mostRecentSuccessfulDeployment.summary.slice(0, 60)}
                      {app.mostRecentSuccessfulDeployment.summary.length > 60 ? '…' : ''}
                    </Typography>
                  )}
                </TableCell>

                <TableCell>
                  <Typography variant="body2" fontFamily="monospace" fontSize="0.78rem">
                    {app.gitPath?.repo?.id ?? '—'}
                  </Typography>
                  {app.gitPath?.path && (
                    <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                      {app.gitPath.path}
                    </Typography>
                  )}
                </TableCell>

                <TableCell align="right">
                  <Button
                    size="small"
                    variant="text"
                    href={`${config.baseURL}/applications/${app.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Open in PipeCD
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
