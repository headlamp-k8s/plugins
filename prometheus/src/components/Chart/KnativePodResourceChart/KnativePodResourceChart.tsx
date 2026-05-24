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
import { Box, Typography } from '@mui/material';
import { blue, purple } from '@mui/material/colors';
import { alpha, useTheme } from '@mui/material/styles';
import { fetchMetrics } from '../../../request';
import { createDataProcessor, createTickTimestampFormatter, formatBytes } from '../../../util';
import Chart from '../Chart/Chart';

export interface KnativePodResourceChartProps {
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

export const KnativePodResourceChart = (props: KnativePodResourceChartProps) => {
  const { t } = useTranslation();
  const xTickFormatter = createTickTimestampFormatter(props.timespan);
  const theme = useTheme();

  const podRegex = props.revisionName ? `^${props.revisionName}-.*` : `^${props.serviceName}-.*`;

  const cpuPlots = [
    {
      query: `sum(rate(container_cpu_usage_seconds_total{namespace="${props.namespace}", pod=~"${podRegex}"}[1m]))`,
      name: t('CPU Usage'),
      strokeColor: alpha(blue[600], 0.8),
      fillColor: alpha(blue[400], 0.1),
      dataProcessor: createDataProcessor(0),
    },
  ];

  const memoryPlots = [
    {
      query: `sum(container_memory_working_set_bytes{namespace="${props.namespace}", pod=~"${podRegex}"})`,
      name: t('Memory Usage'),
      strokeColor: alpha(purple[600], 0.8),
      fillColor: alpha(purple[400], 0.1),
      dataProcessor: createDataProcessor(0),
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
    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, height: '100%', width: '100%' }}>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle2" align="center" gutterBottom>
          {t('CPU Usage (cores)')}
        </Typography>
        <Box sx={{ flex: 1 }}>
          <Chart
            plots={cpuPlots}
            xAxisProps={xAxisProps}
            yAxisProps={{ domain: [0, 'auto'], width: 60 }}
            CustomTooltip={props.CustomTooltip}
            fetchMetrics={fetchMetrics as any}
            autoRefresh={props.refresh}
            prometheusPrefix={props.prometheusPrefix}
            interval={props.timespan}
            resolution={props.resolution}
            subPath={props.subPath ?? ''}
          />
        </Box>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle2" align="center" gutterBottom>
          {t('Memory Usage')}
        </Typography>
        <Box sx={{ flex: 1 }}>
          <Chart
            plots={memoryPlots}
            xAxisProps={xAxisProps}
            yAxisProps={{ domain: [0, 'auto'], width: 80, tickFormatter: formatBytes }}
            CustomTooltip={props.CustomTooltip}
            fetchMetrics={fetchMetrics as any}
            autoRefresh={props.refresh}
            prometheusPrefix={props.prometheusPrefix}
            interval={props.timespan}
            resolution={props.resolution}
            subPath={props.subPath ?? ''}
          />
        </Box>
      </Box>
    </Box>
  );
};
