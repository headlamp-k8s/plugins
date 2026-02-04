import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { orange } from '@mui/material/colors';
import { alpha, useTheme } from '@mui/material/styles';
import { fetchMetrics } from '../../../request';
import { createDataProcessor, createTickTimestampFormatter } from '../../../util';
import Chart from '../Chart/Chart';

interface KarpenterNodeClaimsProvisionChartProps {
  refresh: boolean;
  prometheusPrefix: string;
  resolution: string;
  subPath: string;
  provisioningDurationQuery: string;
  timespan: string;
  NodePoolTooltip;
}

export const KarpenterNodeClaimsProvisionChart = (
  props: KarpenterNodeClaimsProvisionChartProps
) => {
  const { t } = useTranslation();
  const xTickFormatter = createTickTimestampFormatter(props.timespan);
  const theme = useTheme();

  const plots = [
    {
      query: props.provisioningDurationQuery,
      name: t('Average Provisioning Duration (seconds)'),
      strokeColor: alpha(orange[600], 0.8),
      fillColor: alpha(orange[400], 0.1),
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
      yAxisProps={{
        domain: [0, 'auto'],
        width: 80,
        label: {
          value: t('Duration (s)'),
          angle: -90,
          position: 'insideLeft',
          style: { textAnchor: 'middle' },
        },
      }}
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
