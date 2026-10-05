import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { blue } from '@mui/material/colors';
import { alpha, useTheme } from '@mui/material/styles';
import { fetchMetrics } from '../../../request';
import { createDataProcessor, createTickTimestampFormatter } from '../../../util';
import Chart from '../Chart/Chart';

interface ArgoCDApplicationMetricChartProps {
  refresh: boolean;
  prometheusPrefix: string;
  resolution: string;
  subPath?: string;
  timespan: string;
  query: string;
  metricLabel: string;
  yAxisLabel: string;
  CustomTooltip: (props: any) => JSX.Element | null;
}

/** Renders one Application-specific Argo CD metric using the shared chart behaviour. */
export function ArgoCDApplicationMetricChart(props: ArgoCDApplicationMetricChartProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const xTickFormatter = createTickTimestampFormatter(props.timespan);

  return (
    <Chart
      plots={[
        {
          query: props.query,
          name: t(props.metricLabel),
          strokeColor: alpha(blue[600], 0.8),
          fillColor: alpha(blue[400], 0.1),
          stackId: null,
          dataProcessor: createDataProcessor(0),
        },
      ]}
      xAxisProps={{
        dataKey: 'timestamp',
        tickLine: false,
        tick: tickProps => {
          const value = xTickFormatter(tickProps.payload.value);
          if (!value) return null;

          return (
            <g
              transform={`translate(${tickProps.x},${tickProps.y})`}
              fill={theme.palette.chartStyles.labelColor}
            >
              <text x={0} y={10} dy={0} textAnchor="middle">
                {value}
              </text>
            </g>
          );
        },
      }}
      yAxisProps={{
        domain: [0, 'auto'],
        width: 80,
        label: {
          value: t(props.yAxisLabel),
          angle: -90,
          position: 'insideLeft',
          style: { textAnchor: 'middle' },
        },
      }}
      CustomTooltip={props.CustomTooltip}
      fetchMetrics={fetchMetrics}
      autoRefresh={props.refresh}
      prometheusPrefix={props.prometheusPrefix}
      interval={props.timespan}
      resolution={props.resolution}
      subPath={props.subPath}
    />
  );
}

function escapePrometheusLabelValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function applicationSelector(namespace: string, name: string) {
  return `namespace="${escapePrometheusLabelValue(namespace)}",name="${escapePrometheusLabelValue(
    name
  )}"`;
}

export function getArgoCDApplicationChartConfigs(namespace: string, name: string) {
  const selector = applicationSelector(namespace, name);

  return [
    {
      key: 'sync-activity',
      label: 'Sync activity',
      icon: 'mdi:sync',
      queries: {
        query: `sum(increase(argocd_app_sync_total{${selector}}[5m]))`,
        metricLabel: 'Sync operations',
        yAxisLabel: 'Operations',
      },
      component: ArgoCDApplicationMetricChart,
    },
    {
      key: 'sync-duration',
      label: 'Sync duration',
      icon: 'mdi:timer-outline',
      queries: {
        query: `sum(rate(argocd_app_sync_duration_seconds_total{${selector}}[5m])) / sum(rate(argocd_app_sync_total{${selector}}[5m]))`,
        metricLabel: 'Average sync duration',
        yAxisLabel: 'Seconds',
      },
      component: ArgoCDApplicationMetricChart,
    },
    {
      key: 'orphaned-resources',
      label: 'Orphaned resources',
      icon: 'mdi:alert-outline',
      queries: {
        query: `argocd_app_orphaned_resources_count{${selector}}`,
        metricLabel: 'Orphaned resources',
        yAxisLabel: 'Resources',
      },
      component: ArgoCDApplicationMetricChart,
    },
  ];
}
