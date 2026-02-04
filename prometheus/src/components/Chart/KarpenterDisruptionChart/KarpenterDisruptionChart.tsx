import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { green } from '@mui/material/colors';
import { alpha, useTheme } from '@mui/material/styles';
import { fetchMetrics } from '../../../request';
import { createDataProcessor, createTickTimestampFormatter } from '../../../util';
import Chart from '../Chart/Chart';

interface KarpenterDisruptionChartProps {
  refresh: boolean;
  prometheusPrefix: string;
  resolution: string;
  subPath: string;
  activeNodesQuery: string;
  timespan: string;
  NodePoolTooltip;
}

export const KarpenterDisruptionChart = (props: KarpenterDisruptionChartProps) => {
  const { t } = useTranslation();
  const xTickFormatter = createTickTimestampFormatter(props.timespan);
  const theme = useTheme();

  const plots = [
    {
      query: props.activeNodesQuery,
      name: t('Allowed Disruptions'),
      strokeColor: alpha(green[600], 0.8),
      fillColor: alpha(green[400], 0.1),
      dataProcessor: createDataProcessor(0),
    },
  ];

  const xAxisProps = {
    dataKey: 'timestamp',
    tickLine: false,
    tick: props => {
      const value = xTickFormatter(props.payload.value);
      return (
        value !== '' && (
          <g
            transform={`translate(${props.x},${props.y})`}
            fill={theme.palette.chartStyles.labelColor}
          >
            <text x={0} y={10} dy={0} textAnchor="middle">
              {value}
            </text>
          </g>
        )
      );
    },
  };

  return (
    <Chart
      plots={plots}
      xAxisProps={xAxisProps}
      yAxisProps={{ domain: [0, 'auto'], width: 60 }}
      CustomTooltip={props.NodePoolTooltip}
      fetchMetrics={fetchMetrics}
      autoRefresh={props.refresh}
      prometheusPrefix={props.prometheusPrefix}
      interval={props.timespan}
      resolution={props.resolution}
      subPath={props.subPath}
    />
  );
};
