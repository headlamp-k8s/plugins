import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { alpha, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import { blue } from '@mui/material/colors';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMetrics } from '../../../request';
import {
  ChartDataPoint,
  createDataProcessor,
  createTickTimestampFormatter,
  PrometheusResponse,
} from '../../../util';
import Chart from '../Chart/Chart';
import { KedaChartProps } from '../KedaChart/KedaChart';
import {
  BaseSeriesInfo,
  extractSeriesInfo,
  groupSeriesByInstance,
  InstanceGroup,
} from '../KedaChart/KedaChart';

interface KedaHPASeriesInfo extends BaseSeriesInfo {
  horizontalpodautoscaler: string;
}

function extractHPAsSeriesInfo(response: PrometheusResponse): KedaHPASeriesInfo[] {
  return extractSeriesInfo<KedaHPASeriesInfo>(response, metric => ({
    horizontalpodautoscaler: metric.horizontalpodautoscaler || 'Unknown HPA',
  }));
}

interface KedaHPAReplicasChartProps extends KedaChartProps {
  prometheusPrefix: string;
  interval: string;
  resolution: string;
  autoRefresh: boolean;
  subPath: string;
}

export function KedaHPAReplicasChart(props: KedaHPAReplicasChartProps) {
  const { t } = useTranslation();
  const xTickFormatter = createTickTimestampFormatter(props.interval);
  const theme = useTheme();

  // State for instance groups management
  const [instanceGroups, setInstanceGroups] = useState<InstanceGroup<KedaHPASeriesInfo>[]>([]);
  const [selectedInstanceIndex, setSelectedInstanceIndex] = useState<number>(0);

  // State to force chart updates
  const [chartKey, setChartKey] = useState(0);

  // Force chart re-render when instance selection changes
  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [selectedInstanceIndex]);

  const hpaReplicasDataProcessor = useCallback(
    (response: PrometheusResponse): ChartDataPoint[] => {
      const newSeriesInfo = extractHPAsSeriesInfo(response);
      const newInstanceGroups = groupSeriesByInstance(newSeriesInfo);

      // Update instance groups only when structure changes
      setInstanceGroups(prevGroups => {
        const groupsChanged =
          prevGroups.length !== newInstanceGroups.length ||
          prevGroups.some((group, i) => group.instance !== newInstanceGroups[i]?.instance);

        if (groupsChanged) {
          // Reset selection if current index is out of bounds
          setSelectedInstanceIndex(prevIndex =>
            Math.min(prevIndex, Math.max(0, newInstanceGroups.length - 1))
          );

          return newInstanceGroups;
        }

        return prevGroups;
      });

      // Update current Prometheus series index based on new selection
      // HPA charts only have one series per instance (unlike scaler metrics)
      let prometheusSeriesIndex = 0;
      if (newInstanceGroups.length > 0) {
        // Clamp instance index to valid range
        const actualInstanceIndex = Math.min(selectedInstanceIndex, newInstanceGroups.length - 1);
        const selectedGroup = newInstanceGroups[actualInstanceIndex];

        if (selectedGroup && selectedGroup.series.length > 0) {
          prometheusSeriesIndex = selectedGroup.series[0]?.index ?? 0;
        }
      }

      // Process data using the current Prometheus series index
      return createDataProcessor(prometheusSeriesIndex)(response);
    },
    [selectedInstanceIndex]
  );

  // Memoized plots array - including chartKey to ensure re-renders when data should update
  const plots = useMemo(
    () => [
      {
        query: props.hpaReplicasQuery,
        name: t('Num Replicas'),
        strokeColor: alpha(blue[600], 0.8),
        fillColor: alpha(blue[400], 0.1),
        dataProcessor: hpaReplicasDataProcessor,
      },
    ],
    [
      props.hpaReplicasQuery,
      hpaReplicasDataProcessor,
      instanceGroups,
      selectedInstanceIndex,
      chartKey,
    ]
  );

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
      {/* Instance Selector */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'start' }}>
        {instanceGroups.length > 1 ? (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="instance-select-label">{t('Instance')}</InputLabel>
            <Select
              id="instance-select"
              labelId="instance-select-label"
              value={selectedInstanceIndex}
              label={t('Instance')}
              onChange={e => setSelectedInstanceIndex(Number(e.target.value))}
            >
              {instanceGroups.map((group, index) => (
                <MenuItem key={index} value={index}>
                  <Box>
                    <Box component="span" sx={{ fontWeight: 500 }}>
                      {group.instance}
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        color: 'text.secondary',
                        ml: 1,
                      }}
                    >
                      [`{group.series[0].startTime.toLocaleTimeString()} -{' '}
                      {group.series[0].endTime.toLocaleTimeString()}`]
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Box sx={{ visibility: 'hidden' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="instance-select-label-hidden">Instance</InputLabel>
              <Select
                id="instance-select-hidden"
                labelId="instance-select-label-hidden"
                value={0}
                label="Instance"
                onChange={() => {}}
              >
                <MenuItem value={0}>Dummy</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </Box>

      {/* HPA Replicas Chart */}
      <Box sx={{ flex: 1, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, p: 2 }}>
        <Chart
          key={chartKey}
          plots={plots}
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
