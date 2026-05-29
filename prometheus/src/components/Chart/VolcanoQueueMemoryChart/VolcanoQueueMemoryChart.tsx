import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { blue, green, orange, red } from '@mui/material/colors';
import { alpha, useTheme } from '@mui/material/styles';
import { fetchMetrics } from '../../../request';
import { createDataProcessor, createTickTimestampFormatter, formatBytes } from '../../../util';
import Chart from '../Chart/Chart';

interface VolcanoQueueMemoryChartProps {
  refresh: boolean;
  prometheusPrefix: string;
  resolution: string;
  subPath: string;
  timespan: string;
  allocatedQuery: string;
  requestQuery: string;
  deservedQuery: string;
  capacityQuery: string;
  CustomTooltip: (props: any) => JSX.Element | null;
}

export function VolcanoQueueMemoryChart(props: VolcanoQueueMemoryChartProps) {
  const { t } = useTranslation();
  const xTickFormatter = createTickTimestampFormatter(props.timespan);
  const dataProcessor = createDataProcessor(0);
  const theme = useTheme();

  return (
    <Chart
      plots={[
        {
          query: props.allocatedQuery,
          name: t('Allocated'),
          strokeColor: alpha(blue[600], 0.8),
          fillColor: alpha(blue[400], 0.1),
          stackId: null,
          dataProcessor,
        },
        {
          query: props.requestQuery,
          name: t('Requested'),
          strokeColor: alpha(orange[600], 0.8),
          fillColor: alpha(orange[400], 0.1),
          stackId: null,
          dataProcessor,
        },
        {
          query: props.deservedQuery,
          name: t('Deserved'),
          strokeColor: alpha(green[600], 0.8),
          fillColor: alpha(green[400], 0.1),
          stackId: null,
          dataProcessor,
        },
        {
          query: props.capacityQuery,
          name: t('Capacity'),
          strokeColor: alpha(red[600], 0.8),
          fillColor: alpha(red[400], 0.1),
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
        tick: ({ x, y, payload }) => (
          <g transform={`translate(${x},${y})`} fill={theme.palette.chartStyles.labelColor}>
            <text x={-35} y={0} dy={0} textAnchor="middle">
              {formatBytes(payload.value)}
            </text>
          </g>
        ),
        width: 90,
      }}
      CustomTooltip={tooltipProps =>
        props.CustomTooltip({
          ...tooltipProps,
          valueFormatter: formatBytes,
        })
      }
      fetchMetrics={fetchMetrics}
      autoRefresh={props.refresh}
      prometheusPrefix={props.prometheusPrefix}
      interval={props.timespan}
      resolution={props.resolution}
      subPath={props.subPath}
    />
  );
}
