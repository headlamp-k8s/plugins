import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { alpha, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import { green } from '@mui/material/colors';
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
import {
  BaseSeriesInfo,
  extractSeriesInfo,
  groupSeriesByInstance,
  InstanceGroup,
  KedaChartProps,
} from '../KedaChart/KedaChart';

interface KedaScalerSeriesInfo extends BaseSeriesInfo {
  metric: string;
  scaler: string;
}

function extractKedaScalersSeriesInfo(response: PrometheusResponse): KedaScalerSeriesInfo[] {
  return extractSeriesInfo<KedaScalerSeriesInfo>(response, metric => ({
    metric: metric.metric || 'Unknown Metric',
    scaler: metric.scaler || 'Unknown Scaler',
  }));
}

interface KedaScalerMetricsChartProps extends KedaChartProps {
  prometheusPrefix: string;
  interval: string;
  resolution: string;
  autoRefresh: boolean;
  subPath: string;
}

export function KedaScalerMetricsChart(props: KedaScalerMetricsChartProps) {
  const { t } = useTranslation();
  const xTickFormatter = createTickTimestampFormatter(props.interval);
  const theme = useTheme();

  // State for instance groups management
  const [instanceGroups, setInstanceGroups] = useState<InstanceGroup<KedaScalerSeriesInfo>[]>([]);
  const [selectedInstanceIndex, setSelectedInstanceIndex] = useState<number>(0);

  // State for Scaler series management
  const [selectedScalerSeriesIndex, setSelectedScalerSeriesIndex] = useState<number>(0);

  // State to force chart updates
  const [chartKey, setChartKey] = useState(0);

  // Force chart re-render when instance or series selection changes
  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [selectedInstanceIndex, selectedScalerSeriesIndex]);

  const scalerMetricsDataProcessor = useCallback(
    (response: PrometheusResponse): ChartDataPoint[] => {
      const newSeriesInfo = extractKedaScalersSeriesInfo(response);
      const newInstanceGroups = groupSeriesByInstance(newSeriesInfo);

      // Update instance groups only when structure changes
      setInstanceGroups(prevGroups => {
        const groupsChanged =
          prevGroups.length !== newInstanceGroups.length ||
          prevGroups.some((group, i) => {
            const newGroup = newInstanceGroups[i];
            if (!newGroup || group.instance !== newGroup.instance) {
              return true;
            }

            // Check if series within the group have changed
            if (group.series.length !== newGroup.series.length) {
              return true;
            }

            // Check if any series properties have changed
            return group.series.some((series, j) => {
              const newSeries = newGroup.series[j];
              return (
                !newSeries ||
                series.metric !== newSeries.metric ||
                series.scaler !== newSeries.scaler ||
                series.index !== newSeries.index
              );
            });
          });

        if (groupsChanged) {
          // Reset selection if current index is out of bounds
          setSelectedInstanceIndex(prevIndex =>
            Math.min(prevIndex, Math.max(0, newInstanceGroups.length - 1))
          );
          setSelectedScalerSeriesIndex(0);

          return newInstanceGroups;
        }

        return prevGroups;
      });

      // Update current Prometheus series index based on new selection
      // Scaler metrics have multiple series per instance (different metrics per scaler)
      let prometheusSeriesIndex = 0;
      if (newInstanceGroups.length > 0) {
        // Clamp instance index to valid range
        const actualInstanceIndex = Math.min(selectedInstanceIndex, newInstanceGroups.length - 1);
        const selectedGroup = newInstanceGroups[actualInstanceIndex];

        if (selectedGroup && selectedGroup.series.length > 0) {
          // Clamp series index to valid range within the selected instance
          const actualSeriesIndex = Math.min(
            selectedScalerSeriesIndex,
            selectedGroup.series.length - 1
          );
          prometheusSeriesIndex = selectedGroup.series[actualSeriesIndex]?.index ?? 0;
        }
      }

      // Process data using the current Prometheus series index
      return createDataProcessor(prometheusSeriesIndex)(response);
    },
    [selectedInstanceIndex, selectedScalerSeriesIndex]
  );

  // Memoized plots array - including chartKey to ensure re-renders when data should update
  const plots = useMemo(() => {
    const currentInstanceGroup = instanceGroups[selectedInstanceIndex];
    const currentScalerSeries = currentInstanceGroup?.series[selectedScalerSeriesIndex];

    return [
      {
        query: props.scalerMetricsQuery,
        name: currentScalerSeries
          ? `${currentScalerSeries.metric} (${currentScalerSeries.scaler})`
          : '',
        strokeColor: alpha(green[600], 0.8),
        fillColor: alpha(green[400], 0.1),
        dataProcessor: scalerMetricsDataProcessor,
      },
    ];
  }, [
    props.scalerMetricsQuery,
    scalerMetricsDataProcessor,
    instanceGroups,
    selectedInstanceIndex,
    selectedScalerSeriesIndex,
    chartKey,
  ]);

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

  const currentInstanceGroup = instanceGroups[selectedInstanceIndex];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        flex: 1,
      }}
    >
      {/* Instance and Metric Selectors */}
      {instanceGroups.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'start',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          {instanceGroups.length > 1 && (
            <FormControl size="medium" sx={{ minWidth: 180 }}>
              <InputLabel id="instance-select-label">{t('Scaler Instance')}</InputLabel>
              <Select
                id="instance-select"
                labelId="instance-select-label"
                value={selectedInstanceIndex}
                label={t('Scaler Instance')}
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
                        ({group.series.length} metrics)
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {currentInstanceGroup && currentInstanceGroup.series.length > 0 && (
            <FormControl size="medium" sx={{ minWidth: 160 }}>
              <InputLabel id="series-select-label">{t('Metric')}</InputLabel>
              <Select
                id="series-select"
                labelId="series-select-label"
                value={selectedScalerSeriesIndex}
                label={t('Metric')}
                onChange={e => setSelectedScalerSeriesIndex(Number(e.target.value))}
              >
                {currentInstanceGroup.series.map((series, index) => (
                  <MenuItem key={index} value={index}>
                    <Box>
                      <Box component="span" sx={{ fontWeight: 500 }}>
                        {series.metric}
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          color: 'text.secondary',
                          ml: 1,
                        }}
                      >
                        ({series.scaler})
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      )}

      {/* Scaler Metrics Chart */}
      <Box
        sx={{
          flex: 1,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          p: 2,
        }}
      >
        <Chart
          key={chartKey}
          plots={plots}
          xAxisProps={XTickProps}
          yAxisProps={{ domain: [0, 'auto'], width: 60 }}
          CustomTooltip={KedaTooltip}
          fetchMetrics={fetchMetrics}
          {...props}
        />
      </Box>
    </Box>
  );
}
