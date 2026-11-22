/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Code } from '@connectrpc/connect';
import { K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useHistory } from 'react-router-dom';
import {
  getPiped,
  isConfigured,
  isUnimplemented,
  listDeployments,
  listPipeds,
  loadConfig,
  PipeCDApiError,
  PipeCDConfig,
} from '../api/pipecd';
import type { Application, Deployment, Piped, PipedStatus } from '../types/pipecd';
import { alertTextSx } from '../utils/alert';
import { listAllApplications } from '../utils/applications';
import {
  axisTicks,
  Bucket,
  bucketDeployments,
  bucketTotal,
  countSync,
  failureRate,
  hourSpan,
  knownPipeds,
  Outcome,
  OUTCOMES,
  RANGE_SPECS,
  rangeStart,
  recentDeployments,
  TIME_RANGES,
  TimeRange,
} from '../utils/overview';
import {
  ClusterPiped,
  clusterPipeds,
  ConfigMapLike,
  PIPED_LABEL_SELECTOR,
  PodLike,
} from '../utils/pipedPods';
import { formatTimestamp, relativeTime, Translate } from '../utils/time';
import { REQUEST_TIMEOUT_MS, withTimeout } from '../utils/timeout';
import { consoleURL, pluginURL } from '../utils/url';
import { DeploymentStatusLabel } from './DeploymentStatusLabel';
import { NotConfigured } from './NotConfigured';

const DEPLOYMENT_PAGE_SIZE = 50;
/** Stops a very busy project from paging forever. */
const MAX_DEPLOYMENT_PAGES = 20;
const RECENT_LIMIT = 5;
/** About six rows; more than that scroll. Matches the chart panel beside it. */
const PIPED_LIST_HEIGHT = 300;

interface PipedRow {
  id: string;
  name: string;
  version: string;
  startedAt: number;
  apps: number;
  /** False when GetPiped failed, so PipeCD did not confirm this piped. */
  known: boolean;
  status: PipedStatus;
}

interface OverviewData {
  /** The range this data was fetched for; the picker may already show another. */
  range: TimeRange;
  /** Enabled applications only; disabled ones are used to find pipeds. */
  apps: Application[];
  deployments: Deployment[];
  /** True when the page limit was hit before reaching the start of the range. */
  truncated: boolean;
  pipeds: PipedRow[];
  /** True when ListPipeds gave the whole list, with each piped's status. */
  pipedsComplete: boolean;
  /** Set when ListPipeds or one or more GetPiped calls failed. */
  pipedError: string | null;
}

function errorMessage(err: unknown, t: Translate): string {
  if (err instanceof PipeCDApiError) {
    return t('API error {{status}}: {{message}}', { status: err.status, message: err.message });
  }
  return err instanceof Error ? err.message : String(err);
}

/** Gives up on a request after REQUEST_TIMEOUT_MS, so it cannot keep the page loading. */
function timed<T>(promise: Promise<T>, timedOut: string): Promise<T> {
  return withTimeout(promise, REQUEST_TIMEOUT_MS, timedOut);
}

/**
 * ListDeployments has no time filter, so page through it until a whole page is
 * older than the range. PipeCD returns deployments newest-updated first, and a
 * deployment is always updated after it is created, so nothing created inside
 * the range can come after that page.
 */
async function fetchDeploymentsSince(
  config: PipeCDConfig,
  since: number,
  signal: AbortSignal,
  timedOut: string
): Promise<{ deployments: Deployment[]; truncated: boolean }> {
  const seen = new Set<string>();
  const collected: Deployment[] = [];
  let cursor = '';
  for (let page = 0; page < MAX_DEPLOYMENT_PAGES; page++) {
    const resp = await timed(
      listDeployments(config, {
        cursor: cursor || undefined,
        pageSize: DEPLOYMENT_PAGE_SIZE,
        signal,
      }),
      timedOut
    );
    for (const d of resp.deployments) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      if (d.createdAt >= since) collected.push(d);
    }
    const reachedStart = resp.deployments.every(d => d.updatedAt < since);
    if (reachedStart || !resp.cursor || resp.cursor === cursor || !resp.deployments.length) {
      return { deployments: collected, truncated: false };
    }
    cursor = resp.cursor;
  }
  return { deployments: collected, truncated: true };
}

function isAbort(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

/**
 * PipeCD answers NotFound for a deleted piped and InvalidArgument for one in
 * another project, so neither is one of this project's pipeds. Any other
 * failure (network, server, a wrong key, rate limits) says nothing about the
 * piped, so it is worth reporting.
 */
const NOT_THIS_PROJECT_CODES = new Set<number>([Code.NotFound, Code.InvalidArgument]);

function isReported(err: unknown): boolean {
  return !(err instanceof PipeCDApiError) || !NOT_THIS_PROJECT_CODES.has(err.status);
}

/** How many GetPiped calls run at once, so a large project sends no burst. */
const PIPED_LOOKUP_CONCURRENCY = 5;

function pipedRow(p: Piped, apps: number): PipedRow {
  return {
    id: p.id,
    name: p.name || p.id,
    version: p.version,
    startedAt: p.startedAt,
    known: true,
    apps,
    status: p.status,
  };
}

/**
 * Looks up each piped id, with `counts` giving its number of applications.
 * Disabled pipeds are left out, as ListPipeds results are.
 */
async function fetchPipeds(
  config: PipeCDConfig,
  ids: string[],
  counts: Map<string, number>,
  signal: AbortSignal,
  timedOut: string
): Promise<{ pipeds: PipedRow[]; errors: unknown[] }> {
  // One failed piped should not hide the others, so settle each call. A few
  // workers take the ids in turn, and each timeout starts when its call is sent.
  // Each call has its own signal, so a timeout cancels the request and frees
  // its place instead of leaving it open.
  const results: PromiseSettledResult<Piped>[] = new Array(ids.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < ids.length && !signal.aborted) {
      const i = next++;
      const call = new AbortController();
      const cancel = (): void => call.abort();
      signal.addEventListener('abort', cancel);
      try {
        results[i] = {
          status: 'fulfilled',
          value: await timed(getPiped(config, ids[i], call.signal), timedOut),
        };
      } catch (reason) {
        results[i] = { status: 'rejected', reason };
      } finally {
        signal.removeEventListener('abort', cancel);
        call.abort();
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(PIPED_LOOKUP_CONCURRENCY, ids.length) }, worker));
  const errors: unknown[] = [];
  const pipeds: PipedRow[] = [];
  results.forEach((result, i) => {
    const id = ids[i];
    const apps = counts.get(id) ?? 0;
    if (result.status === 'fulfilled') {
      if (!result.value.disabled) pipeds.push(pipedRow(result.value, apps));
      return;
    }
    errors.push(result.reason);
    pipeds.push({ id, name: id, version: '', startedAt: 0, apps, known: false, status: 'UNKNOWN' });
  });
  return { pipeds, errors };
}

/**
 * The project's enabled pipeds, as the PipeCD console lists them by default.
 * `listed` is the ListPipeds call, started early so it runs alongside the rest.
 * A server without ListPipeds gets the pipeds of applications (disabled ones
 * too) and deployments looked up instead; any other ListPipeds failure does the
 * same but is reported.
 */
async function fetchAllPipeds(
  config: PipeCDConfig,
  listed: PromiseSettledResult<Piped[]>,
  apps: Application[],
  deployments: Deployment[],
  signal: AbortSignal,
  timedOut: string,
  tooManyPages: string
): Promise<{ pipeds: PipedRow[]; complete: boolean; error: unknown }> {
  // The Apps column counts enabled applications, like the Applications card.
  const counts = knownPipeds(apps, []);
  if (listed.status === 'fulfilled') {
    const pipeds = listed.value
      .filter(p => !p.disabled)
      .map(p => pipedRow(p, counts.get(p.id) ?? 0));
    return { pipeds, complete: true, error: null };
  }
  if (isAbort(listed.reason)) throw listed.reason;

  // Disabled applications are only a way to find more pipeds, so a failure
  // here is reported but does not stop the page.
  let disabledError: unknown = null;
  const disabledApps = await listAllApplications(config, {
    disabled: true,
    signal,
    timedOut,
    tooManyPages,
  }).catch(err => {
    if (isAbort(err)) throw err;
    disabledError = err;
    return [] as Application[];
  });
  const ids = [...knownPipeds([...apps, ...disabledApps], deployments).keys()];
  const result = await fetchPipeds(config, ids, counts, signal, timedOut);
  const listError = isUnimplemented(listed.reason) ? null : listed.reason;
  return {
    pipeds: result.pipeds,
    complete: false,
    error: listError ?? disabledError ?? result.errors[0] ?? null,
  };
}

/** Whether PipeCD sees the piped as connected. */
function ConnectionStatus({ status }: { status: PipedStatus }): JSX.Element {
  const { t } = useTranslation();
  if (status === 'ONLINE') return <StatusLabel status="success">{t('Online')}</StatusLabel>;
  if (status === 'OFFLINE') return <StatusLabel status="error">{t('Offline')}</StatusLabel>;
  return <StatusLabel status="">{t('Unknown')}</StatusLabel>;
}

/** Whether a piped's pod is up in the cluster Headlamp is showing. */
function ClusterStatus({ piped }: { piped: ClusterPiped | undefined }): JSX.Element {
  const { t } = useTranslation();
  if (!piped) {
    return (
      <Tooltip title={t('No pod for this piped in this cluster. It may run elsewhere.')} arrow>
        <span>—</span>
      </Tooltip>
    );
  }
  const where = `${piped.namespace}/${piped.pod}`;
  return (
    <Tooltip title={piped.running ? where : `${where}: ${piped.reason}`} arrow>
      <span>
        <StatusLabel status={piped.running ? 'success' : 'error'}>
          {piped.running ? t('Running') : t('Not running')}
        </StatusLabel>
      </span>
    </Tooltip>
  );
}

function rangeLabel(range: TimeRange, t: Translate): string {
  return range === '24h'
    ? t('Last 24 hours')
    : t('Last {{days}} days', { days: RANGE_SPECS[range].count });
}

interface StatCardProps {
  title: string;
  /** Says whether the card shows the current state or the time range. */
  hint: string;
  value: string;
  children?: React.ReactNode;
}

function StatCard({ title, hint, value, children }: StatCardProps): JSX.Element {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={1}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      </Stack>
      <Typography variant="h4" fontWeight={700} my={0.5}>
        {value}
      </Typography>
      <Typography variant="body2" component="div">
        {children}
      </Typography>
    </Paper>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
      {children}
    </Typography>
  );
}

/**
 * Bar colours. They follow the status labels: green for success, red for
 * failure, amber for anything still running, grey for cancelled.
 */
const OUTCOME_COLORS: Record<Outcome, string> = {
  success: 'success.main',
  failure: 'error.main',
  inProgress: 'warning.main',
  cancelled: 'grey.500',
};

function useOutcomeLabels(): Record<Outcome, string> {
  const { t } = useTranslation();
  return {
    success: t('Success'),
    failure: t('Failure'),
    inProgress: t('In progress'),
    cancelled: t('Cancelled'),
  };
}

/** Show every n-th label on the x axis so they do not run together. */
const LABEL_STEP: Record<TimeRange, number> = { '24h': 3, '7d': 1, '14d': 2, '30d': 5 };

function shortDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function bucketLabel(start: number, range: TimeRange): string {
  return range === '24h' ? hourSpan(start) : shortDate(start);
}

function bucketTitle(start: number, range: TimeRange): string {
  return range === '24h'
    ? `${shortDate(start)}, ${hourSpan(start)}`
    : new Date(start * 1000).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

/** The dates the chart covers, e.g. "22 Oct – 28 Oct". */
function rangeSpan(buckets: Bucket[]): string {
  if (buckets.length === 0) return '';
  const first = shortDate(buckets[0].start);
  const last = shortDate(buckets[buckets.length - 1].start);
  return first === last ? first : `${first} – ${last}`;
}

const CHART_HEIGHT = 180;

function DeploymentChart({ buckets, range }: { buckets: Bucket[]; range: TimeRange }): JSX.Element {
  const { t } = useTranslation();
  const outcomeLabels = useOutcomeLabels();
  const totals = buckets.map(bucketTotal);
  const ticks = axisTicks(Math.max(0, ...totals));
  const top = ticks[ticks.length - 1];
  // A number on top of each bar only fits while the bars are wide enough.
  const showValues = buckets.length <= 24;
  const step = LABEL_STEP[range];
  const sums = Object.fromEntries(
    OUTCOMES.map(o => [o, buckets.reduce((sum, b) => sum + b[o], 0)])
  ) as Record<Outcome, number>;

  return (
    <Box>
      <Stack direction="row" spacing={2} mb={2} justifyContent="flex-end" flexWrap="wrap">
        {OUTCOMES.map(o => (
          <Stack key={o} direction="row" spacing={0.5} alignItems="center">
            <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: OUTCOME_COLORS[o] }} />
            <Typography variant="caption">
              {outcomeLabels[o]} ({sums[o]})
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Stack direction="row" spacing={1} mt={2}>
        <Box sx={{ position: 'relative', height: CHART_HEIGHT, width: 28, flexShrink: 0 }}>
          {ticks.map(v => (
            <Typography
              key={v}
              variant="caption"
              color="text.secondary"
              sx={{
                position: 'absolute',
                right: 0,
                bottom: `calc(${(v / top) * 100}% - 8px)`,
                lineHeight: '16px',
              }}
            >
              {v}
            </Typography>
          ))}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              position: 'relative',
              height: CHART_HEIGHT,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            {ticks.slice(1).map(v => (
              <Box
                key={v}
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: `${(v / top) * 100}%`,
                  borderTop: '1px dashed',
                  borderColor: 'divider',
                }}
              />
            ))}

            {totals.every(n => n === 0) && (
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{ position: 'absolute', inset: 0 }}
              >
                <Typography variant="body2" color="text.secondary">
                  {t('No deployments in this time range.')}
                </Typography>
              </Stack>
            )}

            <Stack
              direction="row"
              spacing={0.5}
              alignItems="flex-end"
              sx={{ position: 'absolute', inset: 0, px: 0.5 }}
            >
              {buckets.map((b, i) => {
                const total = totals[i];
                const title = bucketTitle(b.start, range);
                const label = t('{{time}}: {{count}} deployments', { time: title, count: total });
                const counts = OUTCOMES.filter(o => b[o] > 0).map(
                  o => `${outcomeLabels[o]}: ${b[o]}`
                );
                return (
                  <Tooltip
                    key={b.start}
                    arrow
                    title={
                      <Box>
                        <strong>{label}</strong>
                        {counts.map(c => (
                          <Box key={c}>{c}</Box>
                        ))}
                      </Box>
                    }
                  >
                    {/* Focusable, and named with the counts, so the tooltip's
                        breakdown also reaches keyboard and screen reader users. */}
                    <Box
                      role="img"
                      tabIndex={0}
                      aria-label={[label, ...counts].join(', ')}
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        height: '100%',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          maxWidth: 36,
                          height: `${(total / top) * 100}%`,
                          display: 'flex',
                          flexDirection: 'column-reverse',
                        }}
                      >
                        {showValues && total > 0 && (
                          <Typography
                            variant="caption"
                            sx={{
                              position: 'absolute',
                              bottom: '100%',
                              left: 0,
                              right: 0,
                              textAlign: 'center',
                              fontSize: '0.7rem',
                              lineHeight: 1.4,
                            }}
                          >
                            {total}
                          </Typography>
                        )}
                        {OUTCOMES.map(o =>
                          b[o] > 0 ? (
                            <Box
                              key={o}
                              sx={{
                                height: `${(b[o] / total) * 100}%`,
                                bgcolor: OUTCOME_COLORS[o],
                              }}
                            />
                          ) : null
                        )}
                      </Box>
                    </Box>
                  </Tooltip>
                );
              })}
            </Stack>
          </Box>

          <Stack direction="row" spacing={0.5} mt={0.5} px={0.5}>
            {buckets.map((b, i) => (
              <Typography
                key={b.start}
                variant="caption"
                color="text.secondary"
                textAlign="center"
                noWrap
                sx={{ flex: 1, minWidth: 0, overflow: 'visible' }}
              >
                {i % step === 0 ? bucketLabel(b.start, range) : ''}
              </Typography>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

function LoadingSkeleton(): JSX.Element {
  return (
    <Box aria-label="loading-skeleton">
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 2,
          mb: 2,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={110} />
        ))}
      </Box>
      <Skeleton variant="rounded" height={240} />
    </Box>
  );
}

export function Overview(): JSX.Element {
  const { t } = useTranslation();
  const history = useHistory();
  const config = loadConfig();

  const [range, setRange] = useState<TimeRange>('7d');
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const inFlight = useRef<AbortController | null>(null);

  const fetchOverview = useCallback(
    async (signal: AbortSignal) => {
      if (!isConfigured(config)) return;
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const timedOut = t('The request timed out.');
        const tooManyPages = t('The server sent too many pages of applications.');
        const [apps, deploymentResult, listed] = await Promise.all([
          listAllApplications(config, { signal, timedOut, tooManyPages }),
          fetchDeploymentsSince(config, rangeStart(range, now), signal, timedOut),
          // Settled, so a server without ListPipeds does not fail the page.
          timed(listPipeds(config, signal), timedOut).then(
            (value): PromiseSettledResult<Piped[]> => ({ status: 'fulfilled', value }),
            (reason): PromiseSettledResult<Piped[]> => ({ status: 'rejected', reason })
          ),
        ]);
        const pipedResult = await fetchAllPipeds(
          config,
          listed,
          apps,
          deploymentResult.deployments,
          signal,
          timedOut,
          tooManyPages
        );
        if (signal.aborted) return;
        setData({
          range,
          apps,
          deployments: deploymentResult.deployments,
          truncated: deploymentResult.truncated,
          pipeds: pipedResult.pipeds,
          pipedsComplete: pipedResult.complete,
          pipedError: pipedResult.error ? errorMessage(pipedResult.error, t) : null,
        });
        setLastFetched(now);
      } catch (err) {
        if (isAbort(err)) return;
        setError(errorMessage(err, t));
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.baseURL, config.apiKey, range]
  );

  /** Starts a fetch, cancelling whatever was already running. */
  const refetch = useCallback(() => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    void fetchOverview(controller.signal);
  }, [fetchOverview]);

  useEffect(() => {
    if (!isConfigured(config)) {
      setLoading(false);
      return;
    }
    refetch();
    return () => inFlight.current?.abort();
  }, [refetch, config.baseURL, config.apiKey]);

  // Piped pods in the current cluster. If listing them is not allowed, there is
  // simply no cluster status to show.
  const [pipedPods] = K8s.ResourceClasses.Pod.useList({ labelSelector: PIPED_LABEL_SELECTOR });
  const [pipedConfigMaps] = K8s.ResourceClasses.ConfigMap.useList({
    labelSelector: PIPED_LABEL_SELECTOR,
  });
  const inCluster = useMemo(
    () =>
      clusterPipeds(
        (pipedPods ?? []).map(p => p.jsonData as PodLike),
        (pipedConfigMaps ?? []).map(c => c.jsonData as ConfigMapLike)
      ),
    [pipedPods, pipedConfigMaps]
  );
  const clusterIds = [...inCluster.keys()].sort().join(',');

  // Without ListPipeds, a piped running in the cluster may have no application
  // or deployment yet, so the PipeCD data would leave it out. Look those up
  // separately.
  const [clusterOnly, setClusterOnly] = useState<PipedRow[]>([]);
  const [clusterError, setClusterError] = useState<string | null>(null);
  useEffect(() => {
    const known = new Set(data?.pipeds.map(p => p.id));
    const missing = clusterIds.split(',').filter(id => id && !known.has(id));
    if (!data || data.pipedsComplete || missing.length === 0) {
      setClusterOnly([]);
      setClusterError(null);
      return;
    }
    const controller = new AbortController();
    void fetchPipeds(
      config,
      missing,
      new Map(),
      controller.signal,
      t('The request timed out.')
    ).then(r => {
      if (controller.signal.aborted) return;
      // A piped PipeCD reports as not found or invalid belongs to another
      // project or was deleted, so it is not one of this project's pipeds. A
      // network, server or key failure says nothing about that, so report it
      // instead of hiding it silently.
      setClusterOnly(r.pipeds.filter(p => p.known));
      const reported = r.errors.find(isReported);
      setClusterError(reported ? errorMessage(reported, t) : null);
    });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, clusterIds]);

  if (!isConfigured(config)) {
    return <NotConfigured />;
  }

  // A new lookup may still be running, so the old cluster-only result can hold
  // a piped the refreshed data now lists itself, or one whose pod is gone.
  const listedIds = new Set(data?.pipeds.map(p => p.id));
  const extraPipeds = clusterOnly.filter(p => inCluster.has(p.id) && !listedIds.has(p.id));
  const pipeds = data
    ? [...data.pipeds, ...extraPipeds].sort((a, b) => a.name.localeCompare(b.name))
    : [];
  const runningHere = pipeds.filter(p => inCluster.get(p.id)?.running).length;
  const notRunningHere = pipeds.filter(p => inCluster.get(p.id)?.running === false).length;
  const online = pipeds.filter(p => p.status === 'ONLINE').length;
  const offline = pipeds.filter(p => p.status === 'OFFLINE').length;

  // Label and draw the data with the range it was fetched for. While a new
  // range loads, or if that load fails, the old numbers keep their own label.
  const shownRange = data?.range ?? range;
  const spec = RANGE_SPECS[shownRange];
  const sync = data ? countSync(data.apps) : null;
  const rate = data ? failureRate(data.deployments) : null;
  const buckets =
    data && lastFetched ? bucketDeployments(data.deployments, shownRange, lastFetched) : [];
  const recent = data ? recentDeployments(data.deployments, RECENT_LIMIT) : [];
  const currentRange = rangeLabel(shownRange, t);
  const pipedError = data?.pipedError ?? clusterError;

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
            {t('PipeCD Overview')}
          </Typography>
          {lastFetched && (
            <Typography variant="caption" color="text.secondary">
              {t('Last updated: {{time}}', { time: lastFetched.toLocaleTimeString() })}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <FormControl size="small" variant="outlined" sx={{ minWidth: 160 }}>
            <InputLabel id="range-label">{t('Time range')}</InputLabel>
            <Select
              labelId="range-label"
              id="range"
              value={range}
              label={t('Time range')}
              onChange={e => setRange(e.target.value as TimeRange)}
            >
              {TIME_RANGES.map(r => (
                <MenuItem key={r} value={r}>
                  {rangeLabel(r, t)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            onClick={() => refetch()}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={14} /> : undefined}
            sx={{ height: 40, whiteSpace: 'nowrap' }}
          >
            {t('Refresh')}
          </Button>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {error && (
        <Alert
          severity="error"
          sx={[{ mb: 2 }, alertTextSx('error')]}
          onClose={() => setError(null)}
        >
          <strong>{t('Failed to load overview')}</strong>
          <br />
          {error}
        </Alert>
      )}

      {loading && !data && <LoadingSkeleton />}

      {data && sync && rate && (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 2,
              mb: 2,
            }}
          >
            <StatCard title={t('Pipeds')} hint={t('Now')} value={String(pipeds.length)}>
              {data.pipedsComplete ? (
                <>
                  <Box component="span" color="success.main" mr={1.5}>
                    {t('{{count}} online', { count: online })}
                  </Box>
                  <Box component="span" color="error.main">
                    {t('{{count}} offline', { count: offline })}
                  </Box>
                </>
              ) : !pipeds.some(p => inCluster.has(p.id)) ? (
                <Box component="span" color="text.secondary">
                  {t('with an application or a recent deployment')}
                </Box>
              ) : (
                <>
                  <Box component="span" color="success.main" mr={1.5}>
                    {t('{{count}} running in this cluster', { count: runningHere })}
                  </Box>
                  {notRunningHere > 0 && (
                    <Box component="span" color="error.main">
                      {t('{{count}} not running', { count: notRunningHere })}
                    </Box>
                  )}
                </>
              )}
            </StatCard>

            <StatCard title={t('Applications')} hint={t('Now')} value={String(data.apps.length)}>
              <Box component="span" color="success.main" mr={1.5}>
                {t('{{count}} synced', { count: sync.synced })}
              </Box>
              <Box component="span" color="error.main">
                {t('{{count}} out of sync', { count: sync.outOfSync })}
              </Box>
            </StatCard>

            <StatCard
              title={t('Deployments')}
              hint={currentRange}
              value={String(data.deployments.length)}
            >
              <Box component="span" color="text.secondary">
                {spec.unit === 'hour'
                  ? t('about {{rate}} / hour', {
                      rate: (data.deployments.length / spec.count).toFixed(1),
                    })
                  : t('about {{rate}} / day', {
                      rate: (data.deployments.length / spec.count).toFixed(1),
                    })}
              </Box>
            </StatCard>

            <StatCard
              title={t('Change failure rate')}
              hint={currentRange}
              value={`${Math.round(rate.rate * 100)}%`}
            >
              <Box component="span" color="text.secondary">
                {t('{{failed}} of {{finished}} failed', {
                  failed: rate.failed,
                  finished: rate.finished,
                })}
              </Box>
            </StatCard>
          </Box>

          {data.truncated && (
            <Alert severity="info" sx={[{ mb: 2 }, alertTextSx('info')]}>
              {t('Only the newest {{count}} deployments are counted.', {
                count: data.deployments.length,
              })}
            </Alert>
          )}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' },
              gap: 2,
              mb: 2,
            }}
          >
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" alignItems="baseline" gap={1.5} flexWrap="wrap">
                <SectionTitle>{t('Deployment frequency')}</SectionTitle>
                <Typography variant="body2" color="text.secondary">
                  {rangeSpan(buckets)}
                </Typography>
              </Stack>
              <DeploymentChart buckets={buckets} range={shownRange} />
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <SectionTitle>{t('Pipeds')}</SectionTitle>
              {pipeds.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  {t('No pipeds found.')}
                </Typography>
              ) : (
                // Scroll inside the panel so a project with many pipeds does not
                // stretch the page; the header stays in place.
                <Box sx={{ maxHeight: PIPED_LIST_HEIGHT, overflowY: 'auto' }}>
                  <Table size="small" stickyHeader aria-label="pipecd-pipeds-table">
                    <TableHead>
                      <TableRow sx={{ '& .MuiTableCell-root': { fontWeight: 700 } }}>
                        <TableCell>{t('Name')}</TableCell>
                        {data.pipedsComplete && <TableCell>{t('Status')}</TableCell>}
                        <TableCell>{t('In this cluster')}</TableCell>
                        <TableCell>{t('Version')}</TableCell>
                        <TableCell>{t('Started')}</TableCell>
                        <TableCell align="right">{t('Apps')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pipeds.map(p => (
                        <TableRow key={p.id} sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell>
                            <Tooltip title={p.id} arrow>
                              <span>{p.name}</span>
                            </Tooltip>
                          </TableCell>
                          {data.pipedsComplete && (
                            <TableCell>
                              <ConnectionStatus status={p.status} />
                            </TableCell>
                          )}
                          <TableCell>
                            <ClusterStatus piped={inCluster.get(p.id)} />
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{p.version || '—'}</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Tooltip title={formatTimestamp(p.startedAt)} arrow>
                              <span>{relativeTime(p.startedAt, t)}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="right">{p.apps}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
              {pipedError && (
                <Typography variant="caption" color="warning.main" display="block" mt={1}>
                  {t('Some piped details could not be loaded: {{error}}', {
                    error: pipedError,
                  })}
                </Typography>
              )}
            </Paper>
          </Box>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <SectionTitle>{t('Recent deployments')}</SectionTitle>
            {recent.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                {t('No deployments in this time range.')}
              </Typography>
            ) : (
              <Table size="small" aria-label="pipecd-recent-deployments-table">
                <TableBody>
                  {recent.map(d => {
                    const detail = pluginURL(`/pipecd/deployments/${d.id}`);
                    return (
                      <TableRow
                        key={d.id}
                        hover
                        onClick={() => history.push(detail)}
                        sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                      >
                        <TableCell sx={{ fontFamily: 'monospace', width: 90 }}>
                          {d.trigger.commit?.hash ? d.trigger.commit.hash.slice(0, 7) : '—'}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {/* A real link, so the row can be reached with the keyboard. */}
                          <Link
                            component={RouterLink}
                            to={detail}
                            underline="hover"
                            color="inherit"
                            // The row navigates too; do not do it twice.
                            onClick={e => e.stopPropagation()}
                          >
                            {d.applicationName}
                          </Link>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 360 }}>
                          <Typography variant="body2" noWrap>
                            {d.summary || d.trigger.commit?.message || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <DeploymentStatusLabel status={d.status} />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Tooltip title={formatTimestamp(d.createdAt)} arrow>
                            <span>{relativeTime(d.createdAt, t)}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="text"
                            href={consoleURL(config.baseURL, `/deployments/${d.id}`, d.projectId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            // Open only the console, not the detail page as well.
                            onClick={e => e.stopPropagation()}
                            sx={{ whiteSpace: 'nowrap' }}
                          >
                            {t('Open in PipeCD')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}
