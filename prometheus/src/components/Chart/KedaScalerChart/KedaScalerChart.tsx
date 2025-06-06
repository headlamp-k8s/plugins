import { alpha, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import { blue, green } from '@mui/material/colors';
import { fetchMetrics } from '../../../request';
import { createTickTimestampFormatter, dataProcessor } from '../../../util';
import Chart from '../Chart/Chart';
import { KedaMetricsChartProps } from '../KedaMetricsChart/KedaMetricsChart';

/**
 * Props for the KedaScalerChart component
 * @interface KedaScalerChartProps
 * @property {string} prometheusPrefix - The prefix for Prometheus metrics
 * @property {string} interval - The time interval for data points
 * @property {string} resolution - The resolution for Prometheus metrics
 * @property {boolean} autoRefresh - Whether to automatically refresh the chart data
 */
interface KedaScalerChartProps extends KedaMetricsChartProps {
  prometheusPrefix: string;
  interval: string;
  resolution: string;
  autoRefresh: boolean;
  subPath: string;
}

export function KedaScalerChart(props: KedaScalerChartProps) {
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

  const KedaTooltip = props => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      const formatter = createTickTimestampFormatter(props.interval);
      return (
        <div
          style={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            padding: theme.spacing(1),
            borderRadius: theme.shape.borderRadius,
          }}
        >
          <p>{`Time: ${formatter(label)}`}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }}>
              {`${p.name}: ${p.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100%', gap: 2 }}>
      <Box sx={{ flex: 1 }}>
        <Chart
          plots={[
            {
              query: props.scalerMetricsQuery,
              name: 'Scaler Metrics Value',
              strokeColor: alpha(green[600], 0.8),
              fillColor: alpha(green[400], 0.1),
              dataProcessor: dataProcessor,
            },
          ]}
          xAxisProps={XTickProps}
          yAxisProps={{ domain: [0, 'auto'], width: 60 }}
          CustomTooltip={KedaTooltip}
          fetchMetrics={fetchMetrics}
          {...props}
        />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Chart
          plots={[
            {
              query: props.hpaReplicasQuery ?? props.activeJobsQuery,
              name: props.hpaReplicasQuery
                ? 'Num Replicas'
                : props.activeJobsQuery
                ? 'Num Active Jobs'
                : '',
              strokeColor: alpha(blue[600], 0.8),
              fillColor: alpha(blue[400], 0.1),
              dataProcessor: dataProcessor,
            },
          ]}
          referenceLines={[
            ...(props.minReplicaCount > 0
              ? [
                  {
                    y: props.minReplicaCount,
                    label: 'minReplicaCount',
                    stroke: 'orange',
                  },
                ]
              : []),
            {
              y: props.maxReplicaCount,
              label: 'maxReplicaCount',
              stroke: 'red',
            },
          ]}
          xAxisProps={XTickProps}
          yAxisProps={{ domain: [0, props.maxReplicaCount + 2], width: 60 }}
          CustomTooltip={KedaTooltip}
          fetchMetrics={fetchMetrics}
          {...props}
        />
      </Box>
    </Box>
  );
}
