import { useTheme } from '@mui/material';
import { fetchMetrics } from '../../../request';
import { createTickTimestampFormatter, dataProcessor } from '../../../util';
import { formatBytes } from '../../../util';
import Chart from '../Chart/Chart';
import { CustomTooltipFormatBytes } from '../common';

/**
 * Props for the MemoryChart component
 * @interface MemoryChartProps
 * @property {string} query - The Prometheus query to fetch memory metrics
 * @property {string} prometheusPrefix - The prefix for Prometheus metrics
 * @property {string} interval - The time interval for data points
 * @property {boolean} autoRefresh - Whether to automatically refresh the chart data
 */
interface MemoryChartProps {
  query: string;
  prometheusPrefix: string;
  interval: string;
  autoRefresh: boolean;
}

export function MemoryChart(props: MemoryChartProps) {
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
    tick: ({ x, y, payload }) => (
      <g transform={`translate(${x},${y})`} fill={theme.palette.chartStyles.labelColor}>
        <text x={-35} y={0} dy={0} textAnchor="middle">
          {formatBytes(payload.value)}
        </text>
      </g>
    ),
    width: 80,
  };

  return (
    <Chart
      plots={[
        {
          query: props.query,
          name: 'memory',
          strokeColor: '#CDC300',
          fillColor: '#FFF178',
          dataProcessor: dataProcessor,
        },
      ]}
      fetchMetrics={fetchMetrics}
      xAxisProps={XTickProps}
      yAxisProps={YTickProps}
      CustomTooltip={CustomTooltipFormatBytes}
      {...props}
    />
  );
}
