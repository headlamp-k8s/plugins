import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { alpha, useTheme } from '@mui/material';
import { blue } from '@mui/material/colors';
import { fetchMetrics } from '../../../request';
import { createTickTimestampFormatter, dataProcessor } from '../../../util';
import Chart from '../Chart/Chart';
import { CustomTooltip } from '../common';

/**
 * Props for the CPUChart component
 * @interface CPUChartProps
 * @property {string} query - The Prometheus query to fetch CPU metrics
 * @property {string} prometheusPrefix - The prefix for Prometheus metrics
 * @property {string} interval - The time interval for data points
 * @property {boolean} autoRefresh - Whether to automatically refresh the chart data
 */
interface CPUChartProps {
  query: string;
  prometheusPrefix: string;
  interval: string;
  resolution: string;
  autoRefresh: boolean;
  subPath: string;
}

export function CPUChart(props: CPUChartProps) {
  const { t } = useTranslation();
  const xTickFormatter = createTickTimestampFormatter(props.interval);
  const theme = useTheme();

  const XTickProps = {
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

  const YTickProps = {
    domain: ['dataMin', 'auto'],
    width: 60,
  };

  return (
    <Chart
      plots={[
        {
          query: props.query,
          name: t('cpu (cores)'),
          strokeColor: alpha(blue[400], 0.8),
          fillColor: alpha(blue[400], 0.1),
          dataProcessor: dataProcessor,
        },
      ]}
      xAxisProps={XTickProps}
      yAxisProps={YTickProps}
      CustomTooltip={CustomTooltip}
      fetchMetrics={fetchMetrics}
      {...props}
    />
  );
}
