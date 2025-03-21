import { useTheme } from '@mui/material';
import { fetchMetrics } from '../../../request';
import { createTickTimestampFormatter, dataProcessor } from '../../../util';
import { formatBytes } from '../../../util';
import Chart from '../Chart/Chart';
import { CustomTooltipFormatBytes } from '../common';

/**
 * Props for the DiskChart component
 * @interface DiskChartProps
 * @property {string} usageQuery - The Prometheus query to fetch disk usage metrics
 * @property {string} capacityQuery - The Prometheus query to fetch disk capacity metrics
 * @property {string} interval - The time interval for data points
 * @property {string} prometheusPrefix - The prefix for Prometheus metrics
 * @property {boolean} autoRefresh - Whether to automatically refresh the chart data
 */
interface DiskChartProps {
  usageQuery: string;
  capacityQuery: string;
  interval: string;
  prometheusPrefix: string;
  autoRefresh: boolean;
  subPath: string;
}

export function DiskChart(props: DiskChartProps) {
  const xTickFormatter = createTickTimestampFormatter(props.interval);
  const theme = useTheme();

  return (
    <Chart
      plots={[
        {
          query: props.usageQuery,
          name: 'usage',
          strokeColor: '#CDC300',
          fillColor: '#FFF178',
          dataProcessor: dataProcessor,
        },
        {
          query: props.capacityQuery,
          name: 'capacity',
          strokeColor: '#006B58',
          fillColor: '#98F6DC',
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
