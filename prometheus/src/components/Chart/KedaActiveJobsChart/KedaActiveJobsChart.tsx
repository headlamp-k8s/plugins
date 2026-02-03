import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { alpha, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import { blue } from '@mui/material/colors';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { fetchMetrics } from '../../../request';
import { createTickTimestampFormatter, dataProcessor } from '../../../util';
import Chart from '../Chart/Chart';
import { KedaChartProps } from '../KedaChart/KedaChart';

interface KedaActiveJobsChartProps extends KedaChartProps {
  prometheusPrefix: string;
  interval: string;
  resolution: string;
  autoRefresh: boolean;
  subPath: string;
}

export function KedaActiveJobsChart(props: KedaActiveJobsChartProps) {
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
          <p>{t('Time: {{ time }}', { time: formatter(label) })}</p>
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
      {/* Placeholder for providing spacing due to Metric selector present in Scaler Metrics Chart */}
      <Box sx={{ visibility: 'hidden' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="select-label-hidden">Placeholder</InputLabel>
          <Select
            id="select-hidden"
            labelId="select-label-hidden"
            value={0}
            label="Placeholder"
            onChange={() => {}}
          >
            <MenuItem value={0}>Placeholder</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Active Jobs Chart */}
      <Box sx={{ flex: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, p: 2 }}>
        <Chart
          plots={[
            {
              query: props.activeJobsQuery,
              name: t('Num Active Jobs'),
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
            ...(props.maxReplicaCount > 0
              ? [
                  {
                    y: props.maxReplicaCount,
                    label: 'maxReplicaCount',
                    stroke: 'red',
                  },
                ]
              : []),
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
