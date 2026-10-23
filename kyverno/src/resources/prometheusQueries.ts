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

import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

export type PrometheusValue = [number, string];

export interface PrometheusResult {
  metric?: Record<string, string>;
  /** Present on a range query (query_range) result. */
  values?: PrometheusValue[];
  /** Present on an instant query (query) result. */
  value?: PrometheusValue;
}

export interface PrometheusResponse {
  status: 'success' | 'error';
  data?: {
    resultType?: string;
    result?: PrometheusResult[];
  };
}

export type ChartDataPoint = { timestamp: number; y: number | null };

// `prefix` is "<namespace>/<pods|services>/<name>:<port>", the same shape useKyvernoCRDs-style
// discovery produces. The Kubernetes API server's proxy subresource forwards everything after
// "/proxy" straight to the target, so this reaches Prometheus's own HTTP API unchanged.
function buildProxyPath(prefix: string, apiPath: string, params: URLSearchParams): string {
  return `/api/v1/namespaces/${prefix}/proxy${apiPath}?${params.toString()}`;
}

/**
 * Runs an instant query (a single current value), e.g. for a stat tile.
 *
 * `cluster` pins the request to a specific cluster rather than whichever one is currently active
 * in the URL at the moment the request actually fires; only pass it where that race matters (see
 * usePrometheus.ts's discovery path), omit it (not an empty string) everywhere else so this keeps
 * following the default "current cluster" behavior ApiProxy.request already provides.
 */
export async function queryInstant(
  prefix: string,
  query: string,
  cluster?: string
): Promise<PrometheusResponse> {
  const params = new URLSearchParams({ query });
  return ApiProxy.request(buildProxyPath(prefix, '/api/v1/query', params), {
    method: 'GET',
    ...(cluster !== undefined ? { cluster } : {}),
  });
}

/** Runs a range query (a time series), e.g. for a chart. */
export async function queryRange(
  prefix: string,
  query: string,
  from: number,
  to: number,
  step: number
): Promise<PrometheusResponse> {
  const params = new URLSearchParams({
    query,
    start: String(from),
    end: String(to),
    step: String(step),
  });
  return ApiProxy.request(buildProxyPath(prefix, '/api/v1/query_range', params), {
    method: 'GET',
  });
}

/** Extracts the single number from an instant query's first result, or null if there isn't one. */
export function instantValue(response: PrometheusResponse): number | null {
  const value = response.data?.result?.[0]?.value?.[1];
  if (value === undefined) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

/** Extracts a time series from a range query's first result into chart-ready points. */
export function rangeSeries(response: PrometheusResponse): ChartDataPoint[] {
  const values = response.data?.result?.[0]?.values ?? [];
  return values.map(([timestamp, value]) => {
    const num = Number(value);
    return { timestamp, y: isNaN(num) ? null : num };
  });
}

// query_range can omit evaluation timestamps entirely for an interval a function like
// histogram_quantile has no result for, rather than returning an explicit NaN there (which
// rangeSeries above would already turn into an honest `{ y: null }` point). A missing timestamp
// isn't a missing point, so a chart's own connectNulls={false} never even sees it: with nothing
// between the samples on either side of a sufficiently long outage, a line chart draws a straight
// line across the whole gap as if it were real, continuous data. Inserting an explicit null point
// whenever two consecutive samples are more than one scrape step apart turns that invented trend
// back into a visible break.
export function withGapMarkers(data: ChartDataPoint[], stepSeconds: number): ChartDataPoint[] {
  return data.flatMap((point, index) => {
    const previous = data[index - 1];
    if (previous && point.timestamp - previous.timestamp > stepSeconds) {
      return [{ timestamp: previous.timestamp + stepSeconds, y: null }, point];
    }
    return [point];
  });
}

// Decides whether a sibling "sum(increase(...)) or vector(0)" value query's result is trustworthy,
// from two checks against the same metric: `coverageRes`, a `min(count_over_time(metric[window]))`
// query, and `baselineRes`, a `count(metric offset window)` query.
//
// Coverage alone (>= 2 samples somewhere inside the window) isn't enough: a counter Kyverno only
// lazily registers on its first real event (confirmed in this plugin's own PR description) can
// satisfy "two samples within the window" on the very first two scrapes right after being created
// mid-window, both holding its just-created value, e.g. a brand new "request_allowed=false" series
// scraped twice in a row at value 1. increase() over two identical-valued samples returns 0,
// there's no earlier sample to measure the jump from implicit-absent to that first value against,
// so a real denial still inside the window reads as a confident, wrong 0. baselineRes, queried
// with Prometheus's `offset` modifier, confirms a sample already existed *before* the window
// started, a genuine baseline the window's own increase() can be measured against, not just that
// the window happens to contain two points.
//
// `instantValue` reads null from an empty result on either query, which happens when no series
// currently matches the underlying metric at all. For coverageRes specifically that's a different
// situation from a matching series existing with too few samples (a real number below 2), and the
// two can't be treated the same way: whether an absent series still counts as "fine" depends on
// whether the caller has some other, independent way to confirm the metric's own controller is
// actually being scraped (see each call site's own allowAbsent comment). An absent baselineRes, by
// contrast, always means "unavailable": it only argues a series predates the window, it never
// argues the opposite, so coverage existing inside the window while no baseline predates it is
// exactly the newly-appearing-counter case this function exists to catch.
export function hasReliableIncrease(
  coverageRes: PrometheusResponse,
  baselineRes: PrometheusResponse,
  allowAbsent: boolean
): boolean {
  const coverage = instantValue(coverageRes);
  if (coverage === null) return allowAbsent;
  if (coverage < 2) return false;
  return (instantValue(baselineRes) ?? 0) > 0;
}
