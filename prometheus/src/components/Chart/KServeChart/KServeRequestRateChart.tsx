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
import { getKServeQueries, KServeComponent } from './metrics';

export interface KServeChartPanelProps {
  refresh: boolean;
  prometheusPrefix: string;
  resolution: string;
  subPath: string | null;
  timespan: string;
  namespace: string;
  serviceName: string;
  component: KServeComponent;
  CustomTooltip?: any;
}

export const KServeRequestRateChart = (props: KServeChartPanelProps) => {
  const { t } = useTranslation();
  const xTickFormatter = createTickTimestampFormatter(props.timespan);
  const theme = useTheme();

  const queries = getKServeQueries(props.namespace, props.serviceName, props.component);

  const plots = [
    {
      query: queries.requestRate,
      name: t('Requests/s'),
      strokeColor: 'green',
      fillColor: 'rgba(0, 255, 0, 0.1)',
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
