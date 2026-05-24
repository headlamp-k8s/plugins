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

import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { useTheme } from '@mui/material/styles';
import { fetchMetrics } from '../../../request';
import { createTickTimestampFormatter, dataProcessor } from '../../../util';
import Chart from '../Chart/Chart';

const formatLatency = (value: number | string) => {
  const numValue = Number(value);
  if (isNaN(numValue)) return value;
  if (numValue > 1000) return `${(numValue / 1000).toFixed(2)}s`;
  return `${Math.round(numValue)}ms`;
};

export interface KnativeLatencyChartProps {
  refresh: boolean;
  prometheusPrefix: string;
  resolution: string;
  subPath: string | null;
  timespan: string;
  namespace: string;
  serviceName: string;
  revisionName?: string;
  CustomTooltip?: any;
}

export const KnativeLatencyChart = (props: KnativeLatencyChartProps) => {
  const { t } = useTranslation();
  const xTickFormatter = createTickTimestampFormatter(props.timespan);
  const theme = useTheme();

  const labelSelector = props.revisionName
    ? `namespace="${props.namespace}", revision_name="${props.revisionName}"`
    : `namespace="${props.namespace}", service_name="${props.serviceName}"`;

  const plots = [
    {
      query: `histogram_quantile(0.99, sum(rate(revision_request_latencies_bucket{${labelSelector}}[1m])) by (le))`,
      name: t('P99 Latency'),
      strokeColor: '#d32f2f',
      fillColor: 'rgba(211, 47, 47, 0.1)',
      dataProcessor: dataProcessor,
      stackId: 'p99',
    },
    {
      query: `histogram_quantile(0.95, sum(rate(revision_request_latencies_bucket{${labelSelector}}[1m])) by (le))`,
      name: t('P95 Latency'),
      strokeColor: '#1976d2',
      fillColor: 'rgba(25, 118, 210, 0.1)',
      dataProcessor: dataProcessor,
      stackId: 'p95',
    },
    {
      query: `histogram_quantile(0.50, sum(rate(revision_request_latencies_bucket{${labelSelector}}[1m])) by (le))`,
      name: t('P50 Latency'),
      strokeColor: '#0288d1',
      fillColor: 'rgba(100, 181, 246, 0.1)',
      dataProcessor: dataProcessor,
      stackId: 'p50',
    },
  ];

  const xAxisProps = {
    dataKey: 'timestamp',
    tickLine: false,
    tick: (tickProps: any) => {
      const value = xTickFormatter(tickProps.payload.value);
      if (!value) return null;

      return (
        <g
          transform={`translate(${tickProps.x},${tickProps.y})`}
          fill={theme.palette.chartStyles?.labelColor || theme.palette.text.secondary}
        >
          <text x={0} y={10} dy={0} textAnchor="middle">
            {value}
          </text>
        </g>
      );
    },
  };

  return (
    <Chart
      plots={plots}
      interval={props.timespan}
      resolution={props.resolution}
      prometheusPrefix={props.prometheusPrefix}
      subPath={props.subPath ?? ''}
      fetchMetrics={fetchMetrics as any}
      autoRefresh={props.refresh}
      xAxisProps={xAxisProps}
      yAxisProps={{
        domain: [0, 'auto'],
        width: 80,
        tickFormatter: formatLatency,
      }}
      CustomTooltip={props.CustomTooltip}
    />
  );
};
