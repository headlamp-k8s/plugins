/*
 * Copyright 2026 The Kubernetes Authors
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
import { KServeChartPanelProps } from './KServeRequestRateChart';
import { getKServeQueries } from './metrics';

/**
 * Formats a latency given in seconds, as reported by KServe's request histograms.
 * @param value - Latency in seconds.
 * @returns Latency in milliseconds below one second, otherwise in seconds.
 */
export const formatLatencySeconds = (value: number | string) => {
  const numValue = Number(value);
  if (isNaN(numValue)) return value;
  if (numValue >= 1) return `${numValue.toFixed(2)}s`;
  return `${Math.round(numValue * 1000)}ms`;
};

export const KServeLatencyChart = (props: KServeChartPanelProps) => {
  const { t } = useTranslation();
  const xTickFormatter = createTickTimestampFormatter(props.timespan);
  const theme = useTheme();

  const queries = getKServeQueries(props.namespace, props.serviceName, props.component);

  const plots = [
    {
      query: queries.latencyP99,
      name: t('P99 Latency'),
      strokeColor: '#d32f2f',
      fillColor: 'rgba(211, 47, 47, 0.1)',
      dataProcessor: dataProcessor,
      stackId: 'p99',
    },
    {
      query: queries.latencyP95,
      name: t('P95 Latency'),
      strokeColor: '#1976d2',
      fillColor: 'rgba(25, 118, 210, 0.1)',
      dataProcessor: dataProcessor,
      stackId: 'p95',
    },
    {
      query: queries.latencyP50,
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
        tickFormatter: formatLatencySeconds,
      }}
      CustomTooltip={props.CustomTooltip}
    />
  );
};
