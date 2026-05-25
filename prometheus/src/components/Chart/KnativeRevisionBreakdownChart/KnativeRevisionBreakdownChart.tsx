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
import { Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Box from '@mui/material/Box';
import { alpha, useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';
import { fetchMetrics } from '../../../request';
import {
  createTickTimestampFormatter,
  dataProcessor,
  getTimeRangeAndStepSize,
} from '../../../util';
import Chart from '../Chart/Chart';

const REVISION_COLORS = [
  '#2196f3', // blue
  '#4caf50', // green
  '#ff9800', // orange
  '#9c27b0', // purple
  '#f44336', // red
  '#00bcd4', // cyan
  '#795548', // brown
  '#607d8b', // blue-grey
  '#e91e63', // pink
  '#3f51b5', // indigo
];

export interface KnativeRevisionBreakdownChartProps {
  refresh: boolean;
  prometheusPrefix: string;
  resolution: string;
  subPath: string | null;
  timespan: string;
  namespace: string;
  serviceName: string;
  CustomTooltip?: any;
}

export const KnativeRevisionBreakdownChart = (props: KnativeRevisionBreakdownChartProps) => {
  const { t } = useTranslation();
  const xTickFormatter = createTickTimestampFormatter(props.timespan);
  const theme = useTheme();

  const [revisionNames, setRevisionNames] = useState<string[]>([]);
  const [discovering, setDiscovering] = useState(true);

  // Discover active revisions by querying Prometheus for distinct revision_name values
  useEffect(() => {
    const discoverRevisions = async () => {
      setDiscovering(true);
      try {
        const { from, to, step } = getTimeRangeAndStepSize(props.timespan, props.resolution);
        const response: any = await fetchMetrics({
          prefix: props.prometheusPrefix,
          query: `sum by (revision_name)(rate(revision_request_count{namespace="${props.namespace}", service_name="${props.serviceName}"}[1m]))`,
          from,
          to,
          step,
          subPath: props.subPath ?? undefined,
        });

        if (response.status === 'success' && response.data?.result?.length > 0) {
          const names = response.data.result
            .map((r: any) => r.metric?.revision_name)
            .filter(Boolean) as string[];
          // Deduplicate
          setRevisionNames([...new Set(names)]);
        } else {
          setRevisionNames([]);
        }
      } catch (e) {
        console.error('Error discovering revisions:', e);
        setRevisionNames([]);
      }
      setDiscovering(false);
    };

    discoverRevisions();
  }, [
    props.prometheusPrefix,
    props.namespace,
    props.serviceName,
    props.timespan,
    props.resolution,
    props.subPath,
  ]);

  const plots = useMemo(() => {
    return revisionNames.map((name, i) => ({
      query: `sum(rate(revision_request_count{namespace="${props.namespace}", revision_name="${name}"}[1m]))`,
      name: name,
      strokeColor: REVISION_COLORS[i % REVISION_COLORS.length],
      fillColor: alpha(REVISION_COLORS[i % REVISION_COLORS.length], 0.1),
      dataProcessor: dataProcessor,
      stackId: name, // Use a unique stackId per revision to prevent stacking between revisions
    }));
  }, [revisionNames, props.namespace]);

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

  if (discovering) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <Loader title={t('Discovering revisions...')} />
      </Box>
    );
  }

  if (revisionNames.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
        color="text.secondary"
      >
        {t('No revision data available for this service.')}
      </Box>
    );
  }

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
