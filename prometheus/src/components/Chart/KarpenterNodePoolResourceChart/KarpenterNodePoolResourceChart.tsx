import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { blue, red } from '@mui/material/colors';
import { alpha, useTheme } from '@mui/material/styles';
import { fetchMetrics } from '../../../request';
import { createDataProcessor, createTickTimestampFormatter } from '../../../util';
import Chart from '../Chart/Chart';

interface KarpenterNodePoolResourceChartProps {
  refresh: boolean;
  prometheusPrefix: string;
  resolution: string;
  subPath: string;
  usageQuery: string;
  limitQuery: string;
  timespan: string;
  NodePoolTooltip;
}

export const KarpenterNodePoolResourceChart = (props: KarpenterNodePoolResourceChartProps) => {
  const { t } = useTranslation();
  const xTickFormatter = createTickTimestampFormatter(props.timespan);
  const theme = useTheme();

  const plots = [
    {
      query: props.usageQuery,
      name: t('Resource Usage'),
      strokeColor: alpha(blue[600], 0.8),
      fillColor: alpha(blue[400], 0.1),
      dataProcessor: createDataProcessor(0),
    },
    {
      query: props.limitQuery,
      name: t('Resource Limit'),
      strokeColor: alpha(red[600], 0.8),
      fillColor: alpha(red[400], 0.1),
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
          fill={theme.palette.chartStyles.labelColor}
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
