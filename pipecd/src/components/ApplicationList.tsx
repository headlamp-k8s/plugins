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
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { isConfigured, listApplications, loadConfig, PipeCDApiError } from '../api/pipecd';
import type { Application, ApplicationKind } from '../types/pipecd';
import { formatTimestamp, relativeTime } from '../utils/time';
import { KindBadge } from './KindBadge';
import { NotConfigured } from './NotConfigured';
import { SyncStatusLabel } from './SyncStatusLabel';

const MAX_DESCRIPTION_LENGTH = 90;

/**
 * When an application was last synced.
 *
 * The sync state carries the reliable timestamp, and it is what the detail page
 * shows. PipeCD often omits completedAt on the deployment reference, so the
 * deployment timestamps are only a fallback.
 */
function lastSyncedAt(app: Application): number | undefined {
  return (
    app.syncState?.timestamp ||
    app.mostRecentSuccessfulDeployment?.completedAt ||
    app.mostRecentSuccessfulDeployment?.startedAt
  );
}

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

  const inFlight = useRef<AbortController | null>(null);

  const fetchApps = useCallback(
    async (signal?: AbortSignal) => {
      if (!isConfigured(config)) return;
      setLoading(true);
      setError(null);
      try {
        // PipeCD returns a page at a time and hands back a cursor, so follow it
        // until it stops moving. Without this only the newest page is listed,
        // and search and filtering only ever see that page.
        const collected: Application[] = [];
        let cursor = '';
        for (;;) {
          const resp = await listApplications(config, {
            kind: kindFilter !== 'ALL' ? kindFilter : undefined,
            cursor: cursor || undefined,
            signal,
          });
          collected.push(...(resp.applications ?? []));
          if (!resp.cursor || resp.cursor === cursor || !resp.applications?.length) break;
          cursor = resp.cursor;
        }
        if (signal?.aborted) return;
        setApps(collected);
        setLastFetched(new Date());
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (err instanceof PipeCDApiError) {
          setError(`API error ${err.status}: ${err.message}`);
        } else {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        // A superseded request must not clear the loading state of the one that
        // replaced it.
        if (!signal?.aborted) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.baseURL, config.apiKey, kindFilter]
  );

  /** Starts a fetch, cancelling whatever was already running. */
  const refetch = useCallback(() => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    void fetchApps(controller.signal);
    return controller;
  }, [fetchApps]);

  useEffect(() => {
    if (!isConfigured(config)) {
      setLoading(false);
      return;
    }
    const controller = refetch();
    return () => controller.abort();
  }, [refetch, config.baseURL, config.apiKey]);

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

        <Stack direction="row" spacing={1.5} alignItems="center">
          <FormControl size="small" variant="outlined" sx={{ minWidth: 140 }}>
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
            variant="outlined"
            label="Search applications"
            placeholder="Name or repository"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ minWidth: 240 }}
          />

          <Tooltip title="Refresh">
            <span>
              <Button
                variant="outlined"
                size="small"
                onClick={() => refetch()}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={14} /> : undefined}
                // Match the 40px height of the small outlined inputs beside it.
                sx={{ height: 40, whiteSpace: 'nowrap' }}
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
                  <Tooltip title={formatTimestamp(lastSyncedAt(app))} arrow>
                    <Typography variant="body2">{relativeTime(lastSyncedAt(app))}</Typography>
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
