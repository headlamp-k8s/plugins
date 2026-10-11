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

import { K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { EmptyContent, Loader, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Grid, Link, useTheme } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Trans } from 'react-i18next';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useKyvernoCRDs } from '../hooks/useKyvernoCRDs';
import { usePrometheus } from '../hooks/usePrometheus';
import {
  DeletingPolicy,
  GeneratingPolicy,
  ImageValidatingPolicy,
  MutatingPolicy,
  ValidatingPolicy,
} from '../resources/celPolicies';
import {
  ChartDataPoint,
  instantValue,
  queryInstant,
  queryRange,
  rangeSeries,
} from '../resources/prometheusQueries';
import { MetricCard, NotInstalledBanner } from './common';

const REFRESH_INTERVAL_MS = 30_000;
const LATENCY_WINDOW_SECONDS = 3600; // last 1 hour
const LATENCY_STEP_SECONDS = 30;

// Status colors already established on this Dashboard for policy report results, reused here so
// "red" means the same thing everywhere on this page rather than introducing a second red.
const STATUS_GOOD = '#4caf50';
const STATUS_BAD = '#f44336';

interface HealthQueries {
  // Whether Kyverno's own metrics are actually present in this Prometheus at all, not just
  // whether Prometheus itself answered. See the comment on the canary query below.
  hasKyvernoMetrics: boolean;
  requestRate: number | null;
  denyCount: number | null;
  breakerTrips: number | null;
  // kyverno_policy_rule_info_total only ever covers legacy kyverno.io/v1 Policy/ClusterPolicy
  // rules, current Kyverno does not emit it for any policies.kyverno.io CEL kind at all. Named
  // explicitly so it's never mistaken for full coverage; the "Policies Not Ready" tile combines
  // this with celPoliciesNotReady (derived straight from the K8s API below) to actually cover
  // every policy kind this plugin supports. Counts distinct not-ready policies, not raw rule rows,
  // see the comment on the query itself for why.
  legacyPoliciesNotReady: number | null;
  requeueCount: number | null;
  latency: ChartDataPoint[];
}

type FetchState = 'loading' | 'error' | 'success';

async function fetchHealth(prefix: string): Promise<HealthQueries> {
  const now = Math.floor(Date.now() / 1000);

  const [
    canaryRes,
    requestRateRes,
    denyCountRes,
    breakerTripsRes,
    legacyPoliciesNotReadyRes,
    requeueCountRes,
    latencyRes,
  ] = await Promise.all([
    // kyverno_info is emitted by every Kyverno controller unconditionally, even with zero
    // traffic, so its absence means this Prometheus simply isn't scraping Kyverno at all
    // (no ServiceMonitor, wrong job, etc.), not that everything happens to be healthy. Checked
    // with no "or vector(0)" specifically so a real absence stays distinguishable from a real 0.
    queryInstant(prefix, 'count(kyverno_info)'),
    // "or vector(0)" matters here: sum()/increase() over zero matching series returns an empty
    // result in PromQL, not a 0, e.g. when nothing has been denied in the window at all. Without
    // this every one of these would show "no data" instead of a real 0 on a perfectly healthy
    // cluster, which reads as "unknown" rather than "nothing wrong". This fallback is only safe
    // to read once hasKyvernoMetrics above has confirmed the metrics exist at all.
    queryInstant(prefix, 'sum(rate(kyverno_admission_requests_total[5m])) or vector(0)'),
    queryInstant(
      prefix,
      'sum(increase(kyverno_admission_requests_total{request_allowed="false"}[5m])) or vector(0)'
    ),
    queryInstant(prefix, 'sum(increase(kyverno_breaker_total[1h])) or vector(0)'),
    // kyverno_policy_rule_info_total is an observable gauge recorded once per rule, by every
    // controller process (admission and background) and every replica of each, confirmed against
    // Kyverno's own pkg/metrics/policy_rule.go. A plain sum() over it counts the same not-ready
    // policy once per rule, per controller, per replica, wildly overcounting, and the raw count is
    // rules anyway, not policies, an incompatible unit from celPoliciesNotReady below (one legacy
    // rule in a 10-rule policy versus one whole CEL policy are not the same "1"). Grouping by
    // (policy_namespace, policy_name) first collapses every duplicate rule/controller/replica
    // observation for the same policy into one series, status_ready is itself a policy-level
    // attribute duplicated onto every rule row so this grouping can't accidentally mix a ready
    // and a not-ready rule from the same policy together, then the outer count() tallies distinct
    // not-ready policies. Same idiom Kyverno's own official Grafana dashboard uses
    // (charts/kyverno/charts/grafana/dashboard/kyverno-dashboard.json) to count policies from this
    // exact metric.
    queryInstant(
      prefix,
      'count(count(kyverno_policy_rule_info_total{status_ready!="true"}) by (policy_namespace, policy_name)) or vector(0)'
    ),
    queryInstant(prefix, 'sum(increase(kyverno_controller_requeue_total[1h])) or vector(0)'),
    queryRange(
      prefix,
      'histogram_quantile(0.95, sum(rate(kyverno_admission_review_duration_seconds_bucket[5m])) by (le))',
      now - LATENCY_WINDOW_SECONDS,
      now,
      LATENCY_STEP_SECONDS
    ),
  ]);

  return {
    hasKyvernoMetrics: (instantValue(canaryRes) ?? 0) > 0,
    requestRate: instantValue(requestRateRes),
    denyCount: instantValue(denyCountRes),
    breakerTrips: instantValue(breakerTripsRes),
    legacyPoliciesNotReady: instantValue(legacyPoliciesNotReadyRes),
    requeueCount: instantValue(requeueCountRes),
    latency: rangeSeries(latencyRes),
  };
}

// For a count this project doesn't have a real production baseline to calibrate a "bad"
// threshold against (a denial, a breaker trip, a reconcile requeue can all be perfectly normal
// at some rate), so this only ever asserts the one thing that's unambiguous: zero of it is
// good. Any positive count stays neutral rather than guessing at a false alarm.
function goodIfZero(value: number | null): string | undefined {
  return value === 0 ? STATUS_GOOD : undefined;
}

// Policies Not Ready is the one count where a threshold isn't a guess: a policy that exists but
// isn't ready is unambiguously a problem, at any count above zero.
function goodIfZeroElseBad(value: number | null): string | undefined {
  if (value === null) return undefined;
  return value === 0 ? STATUS_GOOD : STATUS_BAD;
}

function formatRate(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(2)}/s`;
}

function formatCount(value: number | null): string {
  return value === null ? '—' : String(Math.round(value));
}

function LatencyChart({ data }: { data: ChartDataPoint[] }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const accent = theme.palette.mode === 'dark' ? '#3987e5' : '#2a78d6';

  // histogram_quantile returns NaN for a window with zero observations, and rangeSeries turns
  // those into { y: null }, so the array can be non-empty while every point is still null. A
  // plain length check would render an empty-looking chart instead of the "no data" state.
  if (!data.some(point => point.y !== null)) {
    return (
      <Box width="100%" height={220} display="flex" justifyContent="center" alignItems="center">
        <EmptyContent>{t('No data yet.')}</EmptyContent>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} style={{ fontSize: 14 }}>
        <XAxis
          dataKey="timestamp"
          type="number"
          domain={['dataMin', 'dataMax']}
          tickFormatter={ts =>
            new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
          stroke={theme.palette.text.secondary}
          fontSize={12}
        />
        <YAxis
          stroke={theme.palette.text.secondary}
          fontSize={12}
          tickFormatter={v => `${(v * 1000).toFixed(0)}ms`}
        />
        <Tooltip
          labelFormatter={ts => new Date(Number(ts) * 1000).toLocaleTimeString()}
          formatter={(value: number) => [`${(value * 1000).toFixed(1)}ms`, t('P95 latency')]}
        />
        <CartesianGrid strokeDasharray="2 4" stroke={theme.palette.divider} vertical={false} />
        <Area
          type="monotone"
          dataKey="y"
          stroke={accent}
          strokeWidth={2}
          fill={accent}
          fillOpacity={0.15}
          // No connectNulls: histogram_quantile returns NaN (rangeSeries turns that into a null
          // point) for any interval with zero admission requests to compute a quantile over.
          // Bridging across those with a drawn line would visually invent continuous latency data
          // during a real no-traffic gap; recharts' default (unset = false) already renders a
          // genuine gap there instead, which is the honest behavior.
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PolicyEngineHealth() {
  const { t } = useTranslation();
  const cluster = K8s.useCluster();
  const prometheus = usePrometheus();
  const [health, setHealth] = useState<HealthQueries | null>(null);
  const [state, setState] = useState<FetchState>('loading');

  // Prometheus has no readiness signal at all for CEL policy kinds (see the comment on
  // legacyPoliciesNotReady), but every one of these classes already exposes `ready` straight from
  // its own K8s object, read directly here instead, no Prometheus involved.
  const [validatingPolicies, validatingPoliciesError] = ValidatingPolicy.useList();
  const [mutatingPolicies, mutatingPoliciesError] = MutatingPolicy.useList();
  const [generatingPolicies, generatingPoliciesError] = GeneratingPolicy.useList();
  const [deletingPolicies, deletingPoliciesError] = DeletingPolicy.useList();
  const [imageValidatingPolicies, imageValidatingPoliciesError] = ImageValidatingPolicy.useList();
  const crds = useKyvernoCRDs();

  // null means "can't say": either the CEL CRD probe hasn't resolved yet, or it has and the CEL
  // CRD group is confirmed present but at least one of the five lists above is still loading or
  // failed (RBAC denial, transient API error). A real number only comes out once every list that
  // should exist has actually been read. Reporting 0 in either case would read as "all CEL rules
  // ready" when the plugin genuinely doesn't know.
  const celPoliciesNotReady = useMemo((): number | null => {
    if (crds.loading) return null;
    // CEL CRDs genuinely not installed on this cluster (a legacy-only install, the Dashboard
    // route itself is only guarded on the legacy CRD group): there are no CEL policies to be
    // unready, so 0 is the honest answer regardless of what the five lists above did, they're
    // expected to have failed outright against a nonexistent API group.
    if (!crds.cel) return 0;

    const lists = [
      [validatingPolicies, validatingPoliciesError],
      [mutatingPolicies, mutatingPoliciesError],
      [generatingPolicies, generatingPoliciesError],
      [deletingPolicies, deletingPoliciesError],
      [imageValidatingPolicies, imageValidatingPoliciesError],
    ] as const;

    let count = 0;
    for (const [list, error] of lists) {
      if (error || !list) return null;
      for (const policy of list) {
        if (!policy.ready) count++;
      }
    }
    return count;
  }, [
    crds.loading,
    crds.cel,
    validatingPolicies,
    validatingPoliciesError,
    mutatingPolicies,
    mutatingPoliciesError,
    generatingPolicies,
    generatingPoliciesError,
    deletingPolicies,
    deletingPoliciesError,
    imageValidatingPolicies,
    imageValidatingPoliciesError,
  ]);

  useEffect(() => {
    if (!prometheus.prefix) return;

    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchHealth(prometheus.prefix as string);
        if (!cancelled) {
          setHealth(data);
          setState('success');
        }
      } catch {
        if (!cancelled) setState('error');
      }
    };

    setState('loading');
    setHealth(null);
    void load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // `cluster` is deliberately in these deps even though `prometheus.prefix` usually changes
    // with it: two different clusters can discover the identical prefix string (e.g. both have
    // Prometheus at the conventional monitoring/services/prometheus:9090), which would leave
    // this effect keyed only on prefix never rerunning across that switch, showing the old
    // cluster's health data under the new cluster. Keying on `cluster` too forces a refetch (and
    // cancels the outgoing cluster's in-flight request) on every switch, matching the same cache
    // key useKyvernoCRDs and usePrometheus already use for exactly this reason.
  }, [cluster, prometheus.prefix]);

  if (prometheus.loading) {
    return (
      <SectionBox title={t('Policy Engine Health')}>
        <NotInstalledBanner loading />
      </SectionBox>
    );
  }

  if (!prometheus.prefix) {
    return (
      <SectionBox title={t('Policy Engine Health')}>
        <NotInstalledBanner
          message={t('Prometheus was not detected on this cluster.')}
          learnMore={
            <Trans i18nKey="kyverno.learnAboutPrometheus">
              Live policy engine metrics require a Prometheus server this cluster can reach. Learn
              more about{' '}
              <Link
                href="https://kyverno.io/docs/guides/monitoring/"
                target="_blank"
                rel="noopener noreferrer"
              >
                monitoring Kyverno with Prometheus
              </Link>
              .
            </Trans>
          }
        />
      </SectionBox>
    );
  }

  if (state === 'loading') {
    return (
      <SectionBox title={t('Policy Engine Health')}>
        <Loader title={t('Fetching policy engine health')} />
      </SectionBox>
    );
  }

  if (state === 'error' || !health) {
    return (
      <SectionBox title={t('Policy Engine Health')}>
        <Box p={2} display="flex" justifyContent="center">
          <EmptyContent color="error">
            {t('Failed to load metrics from the detected Prometheus server.')}
          </EmptyContent>
        </Box>
      </SectionBox>
    );
  }

  if (!health.hasKyvernoMetrics) {
    return (
      <SectionBox title={t('Policy Engine Health')}>
        <Box p={2} display="flex" justifyContent="center">
          <EmptyContent>
            {t(
              "A Prometheus server was found, but it isn't scraping any Kyverno metrics. Confirm a scrape target points at Kyverno's metrics services."
            )}
          </EmptyContent>
        </Box>
      </SectionBox>
    );
  }

  // Combines the legacy-policy count Prometheus actually tracks with the CEL-policy count read
  // straight from the K8s API, so this tile covers every policy kind this plugin supports instead
  // of silently reporting green whenever only CEL policies are broken. Both sides are counts of
  // distinct not-ready policies, not rules, see the comment on the legacy query itself for why
  // that distinction matters. Stays null (unknown) rather than collapsing to a number whenever the
  // CEL half genuinely can't be determined.
  const policiesNotReady =
    celPoliciesNotReady === null
      ? null
      : (health.legacyPoliciesNotReady ?? 0) + celPoliciesNotReady;

  return (
    <SectionBox title={t('Policy Engine Health')}>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={2.4}>
          <MetricCard title={t('Admission Rate')} value={formatRate(health.requestRate)} />
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <MetricCard
            title={t('Denied (5m)')}
            value={formatCount(health.denyCount)}
            color={goodIfZero(health.denyCount)}
          />
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <MetricCard
            title={t('Breaker Trips (1h)')}
            value={formatCount(health.breakerTrips)}
            color={goodIfZero(health.breakerTrips)}
          />
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <MetricCard
            title={t('Policies Not Ready')}
            value={formatCount(policiesNotReady)}
            color={goodIfZeroElseBad(policiesNotReady)}
          />
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <MetricCard
            title={t('Requeues (1h)')}
            value={formatCount(health.requeueCount)}
            color={goodIfZero(health.requeueCount)}
          />
        </Grid>
      </Grid>
      <SectionBox title={t('Admission Review Latency (P95, last hour)')}>
        <LatencyChart data={health.latency} />
      </SectionBox>
    </SectionBox>
  );
}
