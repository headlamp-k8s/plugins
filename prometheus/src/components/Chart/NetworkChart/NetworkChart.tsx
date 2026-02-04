import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { alpha, useTheme } from '@mui/material';
import { orange, purple } from '@mui/material/colors';
import { fetchMetrics } from '../../../request';
import { createTickTimestampFormatter, dataProcessor } from '../../../util';
import { formatBytes } from '../../../util';
import Chart from '../Chart/Chart';
import { CustomTooltipFormatBytes } from '../common';

/**
 * Props for the NetworkChart component
 * @interface NetworkChartProps
 * @property {string} rxQuery - The Prometheus query to fetch network receive metrics
 * @property {string} txQuery - The Prometheus query to fetch network transmit metrics
 * @property {string} interval - The time interval for data points
 * @property {string} prometheusPrefix - The prefix for Prometheus metrics
 * @property {boolean} autoRefresh - Whether to automatically refresh the chart data
 */
interface NetworkChartProps {
  rxQuery: string;
  txQuery: string;
  interval: string;
  resolution: string;
  prometheusPrefix: string;
  autoRefresh: boolean;
  subPath: string;
}

export function NetworkChart(props: NetworkChartProps) {
  const { t } = useTranslation();
  const xTickFormatter = createTickTimestampFormatter(props.interval);
  const theme = useTheme();

  return (
    <Chart
      plots={[
        {
          query: props.rxQuery,
          name: t('receive'),
          strokeColor: alpha(orange[400], 0.8),
          fillColor: alpha(orange[400], 0.1),
          dataProcessor: dataProcessor,
        },
        {
          query: props.txQuery,
          name: t('transmit'),
          strokeColor: alpha(purple[400], 0.8),
          fillColor: alpha(purple[400], 0.1),
          dataProcessor: dataProcessor,
        },
      ]}
      xAxisProps={{
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
      }}
      yAxisProps={{
        domain: ['dataMin', 'auto'],
        tick: ({ x, y, payload }) => (
          <g transform={`translate(${x},${y})`} fill={theme.palette.chartStyles.labelColor}>
            <text x={-35} y={0} dy={0} textAnchor="middle">
              {formatBytes(payload.value)}
            </text>
          </g>
        ),
        width: 80,
      }}
      fetchMetrics={fetchMetrics}
      CustomTooltip={CustomTooltipFormatBytes}
      {...props}
    />
  );
}
