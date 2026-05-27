import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { blue, green, grey, orange, purple } from '@mui/material/colors';
import { alpha, useTheme } from '@mui/material/styles';
import { fetchMetrics } from '../../../request';
import { createDataProcessor, createTickTimestampFormatter } from '../../../util';
import Chart from '../Chart/Chart';

interface VolcanoQueuePodGroupsChartProps {
  refresh: boolean;
  prometheusPrefix: string;
  resolution: string;
  subPath: string;
  timespan: string;
  inqueueQuery: string;
  pendingQuery: string;
  runningQuery: string;
  completedQuery: string;
  unknownQuery: string;
  CustomTooltip: (props: any) => JSX.Element | null;
}

export function VolcanoQueuePodGroupsChart(props: VolcanoQueuePodGroupsChartProps) {
  const { t } = useTranslation();
  const xTickFormatter = createTickTimestampFormatter(props.timespan);
  const dataProcessor = createDataProcessor(0);
  const theme = useTheme();

  return (
    <Chart
      plots={[
        {
          query: props.inqueueQuery,
          name: t('Inqueue'),
          strokeColor: alpha(purple[600], 0.8),
          fillColor: alpha(purple[400], 0.1),
          stackId: null,
          dataProcessor,
        },
        {
          query: props.pendingQuery,
          name: t('Pending'),
          strokeColor: alpha(orange[600], 0.8),
          fillColor: alpha(orange[400], 0.1),
          stackId: null,
          dataProcessor,
        },
        {
          query: props.runningQuery,
          name: t('Running'),
          strokeColor: alpha(blue[600], 0.8),
          fillColor: alpha(blue[400], 0.1),
          stackId: null,
          dataProcessor,
        },
        {
          query: props.completedQuery,
          name: t('Completed'),
          strokeColor: alpha(green[600], 0.8),
          fillColor: alpha(green[400], 0.1),
          stackId: null,
          dataProcessor,
        },
        {
          query: props.unknownQuery,
          name: t('Unknown'),
          strokeColor: alpha(grey[600], 0.8),
          fillColor: alpha(grey[400], 0.1),
          stackId: null,
          dataProcessor,
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
          value: t('PodGroups'),
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
