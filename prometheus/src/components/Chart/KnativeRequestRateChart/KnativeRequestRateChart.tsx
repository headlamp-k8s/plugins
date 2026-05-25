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

export interface KnativeRequestRateChartProps {
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

export const KnativeRequestRateChart = (props: KnativeRequestRateChartProps) => {
  const { t } = useTranslation();
  const xTickFormatter = createTickTimestampFormatter(props.timespan);
  const theme = useTheme();

  const labelSelector = props.revisionName
    ? `namespace="${props.namespace}", revision_name="${props.revisionName}"`
    : `namespace="${props.namespace}", service_name="${props.serviceName}"`;

  const plots = [
    {
      query: `sum(rate(revision_request_count{${labelSelector}, response_code_class="2xx"}[1m]))`,
      name: t('2xx Success'),
      strokeColor: 'green',
      fillColor: 'rgba(0, 255, 0, 0.1)',
      dataProcessor: dataProcessor,
    },
    {
      query: `sum(rate(revision_request_count{${labelSelector}, response_code_class="4xx"}[1m]))`,
      name: t('4xx Client Error'),
      strokeColor: 'orange',
      fillColor: 'rgba(255, 165, 0, 0.1)',
      dataProcessor: dataProcessor,
    },
    {
      query: `sum(rate(revision_request_count{${labelSelector}, response_code_class="5xx"}[1m]))`,
      name: t('5xx Server Error'),
      strokeColor: 'red',
      fillColor: 'rgba(255, 0, 0, 0.1)',
      dataProcessor: dataProcessor,
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
  );
};
