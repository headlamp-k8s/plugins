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

/** Runs an instant query (a single current value), e.g. for a stat tile. */
export async function queryInstant(prefix: string, query: string): Promise<PrometheusResponse> {
  const params = new URLSearchParams({ query });
  return ApiProxy.request(buildProxyPath(prefix, '/api/v1/query', params), { method: 'GET' });
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
