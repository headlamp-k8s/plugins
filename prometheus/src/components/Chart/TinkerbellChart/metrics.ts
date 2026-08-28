import { fetchMetrics } from '../../../request';
import type { ChartDataPoint, PrometheusResponse } from '../../../util';

/**
 * Converts one aggregated series into finite chart samples, preserving gaps.
 * @param response - Response to a single-series controller query.
 * @returns Timestamped values; unobserved histogram quantiles remain null.
 */
export function processTinkerbellMetrics(response: PrometheusResponse): ChartDataPoint[] {
  return (response.data?.result?.[0]?.values ?? []).map(([timestamp, value]) => ({
    timestamp,
    y: value.trim() !== '' && Number.isFinite(Number(value)) ? Number(value) : null,
  }));
}

/**
 * Adapts controller data to the shared chart's no-data state.
 * @param options - Query range and Kubernetes proxy connection parameters.
 * @returns Prometheus response with entirely unobserved series removed.
 * @throws Propagates connection, permission, and query errors to the chart.
 */
export async function fetchTinkerbellMetrics(options: Parameters<typeof fetchMetrics>[0]) {
  const response = (await fetchMetrics(options)) as PrometheusResponse & { status: string };
  if (response.status !== 'success') {
    return response;
  }
  const result = response.data?.result ?? [];
  if (result.length > 1) {
    throw new Error('Expected a single aggregated Tinkerbell metrics series.');
  }
  return {
    ...response,
    data: {
      ...response.data,
      result: processTinkerbellMetrics(response).some(point => point.y !== null) ? result : [],
    },
  };
}
