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
import { usePrometheus } from '../hooks/usePrometheus';
import {
  DeletingPolicy,
  GeneratingPolicy,
  ImageValidatingPolicy,
  MutatingPolicy,
  ValidatingPolicy,
} from '../resources/celPolicies';
import { CleanupPolicy, ClusterCleanupPolicy } from '../resources/cleanupPolicy';
import { KyvernoClusterPolicy, KyvernoPolicy } from '../resources/kyvernoPolicy';
import {
  ChartDataPoint,
  hasReliableIncrease,
  instantValue,
  queryInstant,
  queryRange,
  rangeSeries,
  withGapMarkers,
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
  // Whether the admission controller specifically is being scraped. hasKyvernoMetrics above only
  // confirms *some* Kyverno process answered: kyverno_info is recorded unconditionally by every
  // controller binary (admission, background, reports, cleanup, ...) at startup, confirmed
  // against Kyverno's pkg/metrics/metrics.go, where initializeMetrics wires up kyvernoInfoMetric
  // the same way regardless of which process calls it. So if the reports or background
  // controller is scraped but the admission controller isn't configured or is down,
  // hasKyvernoMetrics alone stays true while requestRate/denyCount/latency below would otherwise
  // fall back through "or vector(0)" to a confident, wrong 0. This checks presence of
  // kyverno_admission_requests_total itself, with no rate()/window/label filter, so it only reads
  // empty when the admission controller truly isn't being scraped, never because of a genuinely
  // quiet admission window (the counter keeps reporting its last value on every scrape as long as
  // the controller stays up, even with zero new requests).
  hasAdmissionMetrics: boolean;
  requestRate: number | null;
  denyCount: number | null;
  // Same idea as hasAdmissionMetrics, scoped to breaker telemetry instead of the admission
  // controller. kyverno_breaker_total increments on every breaker.Do() call unconditionally,
  // before the breaker's own open() check even runs (confirmed against Kyverno's
  // pkg/breaker/breaker.go), and that breaker runs from admission webhook handlers, background
  // processors, and the reports controller alike. So its presence is as reliable a "this
  // breaker-guarded path exists and is being scraped" signal as kyverno_info is for "some
  // controller exists" above, just scoped to breaker telemetry specifically.
  hasBreakerMetrics: boolean;
  breakerTrips: number | null;
  requeueCount: number | null;
  latency: ChartDataPoint[];
  // The `to` timestamp latency's own query_range call was issued with, so LatencyChart can anchor
  // its axis to the actual queried window instead of the returned samples' own min/max. See the
  // comment on LatencyChart's domain prop for why that distinction matters.
  latencyWindowEnd: number;
}

type FetchState = 'loading' | 'error' | 'success';

async function fetchHealth(prefix: string): Promise<HealthQueries> {
  const now = Math.floor(Date.now() / 1000);

  const [
    canaryRes,
    hasAdmissionMetricsRes,
    requestRateRes,
    denyCountRes,
    denyCoverageRes,
    denyBaselineRes,
    hasBreakerMetricsRes,
    breakerTripsRes,
    breakerCoverageRes,
    breakerBaselineRes,
    requeueCountRes,
    requeueCoverageRes,
    requeueBaselineRes,
    latencyRes,
  ] = await Promise.all([
    // kyverno_info is emitted by every Kyverno controller unconditionally, even with zero
    // traffic, so its absence means this Prometheus simply isn't scraping Kyverno at all
    // (no ServiceMonitor, wrong job, etc.), not that everything happens to be healthy. Checked
    // with no "or vector(0)" specifically so a real absence stays distinguishable from a real 0.
    queryInstant(prefix, 'count(kyverno_info)'),
    // See the comment on hasAdmissionMetrics in HealthQueries: a plain count() of the raw
    // counter, no rate/window/label filter, so this only reads empty when the admission
    // controller truly isn't being scraped.
    queryInstant(prefix, 'count(kyverno_admission_requests_total)'),
    // Deliberately no "or vector(0)" here, unlike denyCount below: rate() needs at least two
    // samples in the window to compute anything, so right after the admission controller starts
    // (or right after hasAdmissionMetrics itself first flips true) the raw counter canary already
    // succeeds while rate() over it still returns empty, not a real 0. A genuinely quiet counter
    // with enough samples already returns 0 on its own. Falling back to vector(0) here would turn
    // "not enough samples yet" into a confidently wrong "0.00/s" instead of leaving it unavailable.
    queryInstant(prefix, 'sum(rate(kyverno_admission_requests_total[5m]))'),
    // "or vector(0)" matters here: sum()/increase() over zero matching series returns an empty
    // result in PromQL, not a 0, e.g. when nothing has been denied in the window at all. Without
    // this every one of these would show "no data" instead of a real 0 on a perfectly healthy
    // cluster, which reads as "unknown" rather than "nothing wrong". This fallback is only safe
    // to read once hasAdmissionMetrics has confirmed the admission controller itself is scraped,
    // hasKyvernoMetrics alone isn't enough, see that comment for why.
    queryInstant(
      prefix,
      'sum(increase(kyverno_admission_requests_total{request_allowed="false"}[5m])) or vector(0)'
    ),
    // Sample-coverage check for the query right above: increase() needs at least two samples
    // *per series* to produce a value, and sum() silently omits any series that currently has
    // fewer than that from the total rather than contributing a 0 for it, so a cluster's very
    // first denial (a brand new "request_allowed=false" series with only one scrape so far) can
    // coexist with an already-populated "request_allowed=true" series and still read as a
    // confident, wrong 0 overall. min(count_over_time(...)) reduces to the single
    // least-covered matching series; see hasFullCoverage below for how an empty result (no
    // matching series at all, as opposed to one with too few samples) is handled differently.
    queryInstant(
      prefix,
      'min(count_over_time(kyverno_admission_requests_total{request_allowed="false"}[5m]))'
    ),
    // Baseline check for the same query, see hasReliableIncrease's comment for why coverage alone
    // isn't enough to trust increase() on a lazily registered series.
    queryInstant(
      prefix,
      'count(kyverno_admission_requests_total{request_allowed="false"} offset 5m)'
    ),
    // See the comment on hasBreakerMetrics in HealthQueries.
    queryInstant(prefix, 'count(kyverno_breaker_total)'),
    // kyverno_breaker_total counts every breaker invocation unconditionally, confirmed against
    // Kyverno's own pkg/breaker/breaker.go: it increments before the breaker's open() check even
    // runs, so normal traffic through a healthy, never-tripped breaker still drives this metric
    // up. kyverno_breaker_drops_total (pkg/metrics/breaker.go's "drops" counter) only increments
    // when the breaker actually fails open and drops work, that's the real "Breaker Trips" signal.
    // This fallback is only safe to read once hasBreakerMetrics has confirmed a breaker is
    // actually being invoked and scraped somewhere in this cluster.
    queryInstant(prefix, 'sum(increase(kyverno_breaker_drops_total[1h])) or vector(0)'),
    // Same sample-coverage reasoning as denyCoverageRes above, scoped to kyverno_breaker_drops_total
    // instead: hasBreakerMetrics only confirms kyverno_breaker_total (a different counter
    // entirely) is scraped, it says nothing about how many samples the drops counter's own series
    // have accumulated.
    queryInstant(prefix, 'min(count_over_time(kyverno_breaker_drops_total[1h]))'),
    // Same baseline reasoning as denyBaselineRes above, scoped to kyverno_breaker_drops_total.
    queryInstant(prefix, 'count(kyverno_breaker_drops_total offset 1h)'),
    queryInstant(prefix, 'sum(increase(kyverno_controller_requeue_total[1h])) or vector(0)'),
    // Requeues has no equivalent of hasAdmissionMetrics/hasBreakerMetrics: kyverno_info only
    // proves *some* Kyverno controller is scraped, not specifically the one that would emit
    // kyverno_controller_requeue_total, and that family is lazily registered (confirmed in this
    // plugin's own PR description), so it can be legitimately absent on a healthy, idle cluster
    // that just hasn't requeued anything yet, indistinguishable from "this controller isn't
    // scraped at all" by presence alone. Without an independent presence signal to fall back on,
    // an empty result here has to stay unavailable rather than trusted as a real 0, see
    // hasFullCoverage's `allowAbsent` parameter below.
    queryInstant(prefix, 'min(count_over_time(kyverno_controller_requeue_total[1h]))'),
    // Same baseline reasoning as denyBaselineRes above, scoped to kyverno_controller_requeue_total.
    queryInstant(prefix, 'count(kyverno_controller_requeue_total offset 1h)'),
    queryRange(
      prefix,
      'histogram_quantile(0.95, sum(rate(kyverno_admission_review_duration_seconds_bucket[5m])) by (le))',
      now - LATENCY_WINDOW_SECONDS,
      now,
      LATENCY_STEP_SECONDS
    ),
  ]);

  const hasAdmissionMetrics = (instantValue(hasAdmissionMetricsRes) ?? 0) > 0;
  const hasBreakerMetrics = (instantValue(hasBreakerMetricsRes) ?? 0) > 0;

  return {
    hasKyvernoMetrics: (instantValue(canaryRes) ?? 0) > 0,
    hasAdmissionMetrics,
    // Falls back to null (unavailable), not the "or vector(0)" value, whenever the admission
    // controller itself isn't confirmed scraped, see the comment on hasAdmissionMetrics.
    requestRate: hasAdmissionMetrics ? instantValue(requestRateRes) : null,
    // Also requires denyCoverageRes/denyBaselineRes to confirm every matching series has enough
    // samples AND predates the window, see hasReliableIncrease's comment. An absent denial series
    // (allowAbsent: true) is still trusted as a real 0 here, hasAdmissionMetrics has already
    // confirmed the admission controller itself is scraped, so "no series for
    // request_allowed=false" genuinely means "nothing denied yet", not "unscraped".
    denyCount:
      hasAdmissionMetrics && hasReliableIncrease(denyCoverageRes, denyBaselineRes, true)
        ? instantValue(denyCountRes)
        : null,
    hasBreakerMetrics,
    // Same reasoning as denyCount above, scoped to breakerCoverageRes/breakerBaselineRes: an
    // absent drops series is trusted as a real 0 once hasBreakerMetrics has confirmed a breaker is
    // scraped somewhere.
    breakerTrips:
      hasBreakerMetrics && hasReliableIncrease(breakerCoverageRes, breakerBaselineRes, true)
        ? instantValue(breakerTripsRes)
        : null,
    // allowAbsent: false here, unlike denyCount/breakerTrips above: see the comment on
    // requeueCoverageRes for why an absent series can't be trusted as a real 0 for this one
    // specifically, there's no independent signal confirming the requeue-emitting controller is
    // actually scraped the way hasAdmissionMetrics/hasBreakerMetrics provide for the other two.
    requeueCount: hasReliableIncrease(requeueCoverageRes, requeueBaselineRes, false)
      ? instantValue(requeueCountRes)
      : null,
    // Not gated on hasAdmissionMetrics like requestRate/denyCount above: this is a *range* query
    // over the last hour, so it can still hold genuine samples from before the admission
    // controller stopped being scraped even while the instant canary reads empty right now.
    // Gating it would hide real latency history during an outage and show "No data yet" instead.
    // LatencyChart already tells a true empty/all-null result apart from this, so nothing here
    // needs the canary's help.
    latency: rangeSeries(latencyRes),
    latencyWindowEnd: now,
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

function LatencyChart({ data, windowEnd }: { data: ChartDataPoint[]; windowEnd: number }) {
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
      <AreaChart data={withGapMarkers(data, LATENCY_STEP_SECONDS)} style={{ fontSize: 14 }}>
        <XAxis
          dataKey="timestamp"
          type="number"
          // Anchored to the actual queried window (windowEnd - LATENCY_WINDOW_SECONDS to
          // windowEnd), not ['dataMin', 'dataMax']: when admission scraping stops, query_range can
          // omit trailing timestamps entirely rather than returning explicit null samples for
          // them, so the last *returned* sample can sit well before the window's real end.
          // withGapMarkers only inserts a gap marker between two returned samples, it has nothing
          // to insert after the last one, so dataMax silently shrinking to that last sample would
          // make an ongoing trailing outage invisible, the chart would just look like it ends
          // early instead of showing the missing interval up to now.
          domain={[windowEnd - LATENCY_WINDOW_SECONDS, windowEnd]}
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

  // Prometheus has no reliable readiness signal for any policy kind: kyverno_policy_rule_info_total
  // only ever covers legacy kyverno.io/v1 Policy/ClusterPolicy rules, never policies.kyverno.io CEL
  // kinds, and even for the legacy kind it undercounts, Kyverno's own Helm chart defaults disable
  // the policy_namespace label on that exact metric (charts/kyverno/values.yaml,
  // metricsConfig.metricsExposure.kyverno_policy_rule_info_total.disabledLabelDimensions), so two
  // unready namespaced policies with the same name in different namespaces collapse into one
  // series once grouped by (policy_namespace, policy_name). Every one of these classes instead
  // exposes `ready` straight from its own K8s object (status.conditions, confirmed against
  // Kyverno's api/kyverno/v1/policy_status.go SetReady/IsReady for the legacy kinds), read
  // directly here, no Prometheus involved, and no namespace-collision risk since these are real
  // distinct K8s objects, not metric series collapsed by a label.
  const [legacyPolicies, legacyPoliciesError] = KyvernoPolicy.useList();
  const [legacyClusterPolicies, legacyClusterPoliciesError] = KyvernoClusterPolicy.useList();
  const [cleanupPolicies, cleanupPoliciesError] = CleanupPolicy.useList();
  const [clusterCleanupPolicies, clusterCleanupPoliciesError] = ClusterCleanupPolicy.useList();
  const [validatingPolicies, validatingPoliciesError] = ValidatingPolicy.useList();
  const [mutatingPolicies, mutatingPoliciesError] = MutatingPolicy.useList();
  const [generatingPolicies, generatingPoliciesError] = GeneratingPolicy.useList();
  const [deletingPolicies, deletingPoliciesError] = DeletingPolicy.useList();
  const [imageValidatingPolicies, imageValidatingPoliciesError] = ImageValidatingPolicy.useList();

  // Every one of these is its own CRD, and Kyverno's Helm chart allows disabling the cleanup
  // controller or any single CEL kind independently of the rest (e.g. ImageValidatingPolicy
  // without the other four), so "policy support present" was never really a single yes/no per
  // cluster. Rather than a separate API-group-level discovery probe, each list request's own
  // error already answers the question for its one kind: the Kubernetes API server returns 404
  // for a list against a resource kind that isn't registered at all, confirmed absence, 0 is the
  // honest count for that kind. Any other failure (403 permission denial, a timeout, a 5xx) means
  // this plugin genuinely doesn't know whether that kind's policies are ready, not that there are
  // none, and must not collapse to 0 either. One kind being confirmed absent must not blank out
  // the kinds that do exist: this used to key off a single crds.cel boolean that conflated
  // "confirmed absent" with "failed to check" and returned null (unknown) for the whole tile the
  // moment any one list errored, hiding every other kind's real count behind one disabled or
  // momentarily-inaccessible CRD.
  const policiesNotReady = useMemo((): number | null => {
    const lists = [
      [legacyPolicies, legacyPoliciesError],
      [legacyClusterPolicies, legacyClusterPoliciesError],
      [cleanupPolicies, cleanupPoliciesError],
      [clusterCleanupPolicies, clusterCleanupPoliciesError],
      [validatingPolicies, validatingPoliciesError],
      [mutatingPolicies, mutatingPoliciesError],
      [generatingPolicies, generatingPoliciesError],
      [deletingPolicies, deletingPoliciesError],
      [imageValidatingPolicies, imageValidatingPoliciesError],
    ] as const;

    let count = 0;
    let unknown = false;
    for (const [list, error] of lists) {
      if (error) {
        if (error.status !== 404) unknown = true;
        continue;
      }
      if (!list) {
        unknown = true; // still loading
        continue;
      }
      for (const policy of list) {
        // CleanupPolicy/ClusterCleanupPolicy's `ready` reads false both for a genuinely broken
        // policy and for a perfectly healthy one Kyverno simply never set a Ready condition on
        // (see the comment on CleanupPolicyBase.readyUnknown), so a confirmed-false `ready` alone
        // isn't enough to count it as not-ready for these two kinds specifically; fall back to the
        // tile's existing unknown handling instead of a false positive.
        if (
          (policy instanceof CleanupPolicy || policy instanceof ClusterCleanupPolicy) &&
          policy.readyUnknown
        ) {
          unknown = true;
          continue;
        }
        if (!policy.ready) count++;
      }
    }
    return unknown ? null : count;
  }, [
    legacyPolicies,
    legacyPoliciesError,
    legacyClusterPolicies,
    legacyClusterPoliciesError,
    cleanupPolicies,
    cleanupPoliciesError,
    clusterCleanupPolicies,
    clusterCleanupPoliciesError,
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
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    // setTimeout chained from the end of the previous load, not setInterval, deliberately: a
    // fixed interval fires on the wall clock regardless of whether the prior seven-query batch
    // has actually finished, and since these are unsequenced async responses, a slow batch
    // finishing after a later one started could overwrite fresher state with stale data (or flip
    // a successful view back to an error). Scheduling the next load only once the current one has
    // fully settled (success or error) means at most one batch is ever in flight.
    const load = async () => {
      try {
        const data = await fetchHealth(prometheus.prefix as string);
        if (!cancelled) {
          setHealth(data);
          setState('success');
        }
      } catch {
        if (!cancelled) setState('error');
      } finally {
        if (!cancelled) {
          timeoutId = setTimeout(load, REFRESH_INTERVAL_MS);
        }
      }
    };

    setState('loading');
    setHealth(null);
    void load();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
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
    // Still render the latency chart below rather than returning here outright: hasKyvernoMetrics
    // reflects the current instant canary, but health.latency is a range query over the last hour
    // (see the comment on it in fetchHealth), so it can still hold genuine pre-outage samples even
    // once every Kyverno scrape target has gone stale. LatencyChart already renders its own "No
    // data yet" when that history turns out to be empty too, so nothing here needs to special-case
    // an outage with no prior samples differently from one with some.
    return (
      <SectionBox title={t('Policy Engine Health')}>
        <Box p={2} display="flex" justifyContent="center">
          <EmptyContent>
            {t(
              "A Prometheus server was found, but it isn't scraping any Kyverno metrics. Confirm a scrape target points at Kyverno's metrics services."
            )}
          </EmptyContent>
        </Box>
        <SectionBox title={t('Admission Review Latency (P95, last hour)')}>
          <LatencyChart data={health.latency} windowEnd={health.latencyWindowEnd} />
        </SectionBox>
      </SectionBox>
    );
  }

  return (
    <SectionBox title={t('Policy Engine Health')}>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={2.4}>
          <MetricCard
            title={t('Admission Rate')}
            value={formatRate(health.requestRate)}
            tooltip={
              !health.hasAdmissionMetrics
                ? t("The admission controller isn't being scraped, so this can't be confirmed.")
                : undefined
            }
          />
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <MetricCard
            title={t('Denied (5m)')}
            value={formatCount(health.denyCount)}
            color={goodIfZero(health.denyCount)}
            tooltip={
              !health.hasAdmissionMetrics
                ? t("The admission controller isn't being scraped, so this can't be confirmed.")
                : undefined
            }
          />
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <MetricCard
            title={t('Breaker Trips (1h)')}
            value={formatCount(health.breakerTrips)}
            color={goodIfZero(health.breakerTrips)}
            tooltip={
              !health.hasBreakerMetrics
                ? t(
                    "No breaker-guarded controller has been scraped recently, so this can't be confirmed."
                  )
                : undefined
            }
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
        <LatencyChart data={health.latency} windowEnd={health.latencyWindowEnd} />
      </SectionBox>
    </SectionBox>
  );
}
