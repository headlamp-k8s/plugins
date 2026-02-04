import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { EmptyContent, Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getTimeRangeAndStepSize } from '../../../util';

/**
 * Props for the Chart component.
 * @interface ChartProps
 * @property {Array<Object>} plots - Array of plot configurations.
 * @property {string} plots[].query - The Prometheus query string.
 * @property {string} plots[].name - Display name for the plot.
 * @property {string} plots[].fillColor - Fill color for the plot area.
 * @property {string} plots[].strokeColor - Stroke color for the plot line.
 * @property {Function} plots[].dataProcessor - Function to process the raw metrics data.
 * @property {Array<Object>} referenceLines - Array of reference line configurations.
 * @property {number} [referenceLines[].x] - X-axis value for a vertical reference line.
 * @property {number} [referenceLines[].y] - Y-axis value for a horizontal reference line.
 * @property {string} referenceLines[].label - Label to display alongside the reference line.
 * @property {string} referenceLines[].stroke - Color of the reference line (can be omitted to use default).
 * @property {string} [referenceLines[].strokeDasharray] - Optional stroke pattern (e.g. "3 3" for dashed lines).
 * @property {Function} fetchMetrics - Function to fetch metrics data from Prometheus.
 * @property {string} interval - Time interval for the chart (e.g. '10m', '1h', '24h').
 * @property {string} prometheusPrefix - URL prefix for Prometheus API calls.
 * @property {boolean} autoRefresh - Whether to automatically refresh the chart data.
 * @property {Object} xAxisProps - Props to pass to the X axis component.
 * @property {Object} yAxisProps - Props to pass to the Y axis component.
 * @property {Function} [CustomTooltip] - Optional custom tooltip component.
 */
export interface ChartProps {
  plots: Array<{
    query: string;
    name: string;
    fillColor: string;
    strokeColor: string;
    dataProcessor: (data: any) => any[];
  }>;
  referenceLines?: Array<{
    x?: number;
    y?: number;
    label: string;
    stroke: string;
    strokeDasharray?: string;
  }>;
  fetchMetrics: (query: object) => Promise<any>;
  interval: string;
  resolution: string;
  prometheusPrefix: string;
  autoRefresh: boolean;
  xAxisProps: {
    [key: string]: any;
  };
  yAxisProps: {
    [key: string]: any;
  };
  CustomTooltip?: ({ active, payload, label }) => JSX.Element | null;
  subPath?: string;
}

export default function Chart(props: ChartProps) {
  const { t } = useTranslation();

  enum ChartState {
    LOADING,
    ERROR,
    NO_DATA,
    SUCCESS,
  }
  const { fetchMetrics, xAxisProps, yAxisProps } = props;
  const [metrics, setMetrics] = useState<Array<any>>([]);
  const [state, setState] = useState<ChartState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  const fetchMetricsData = async (
    plots: Array<{ query: string; name: string; dataProcessor: (data: any) => any }>,
    firstLoad: boolean = false
  ) => {
    const fetchedMetrics: {
      [key: string]: {
        data: { timestamp: number; y: number }[];
        state: ChartState;
      };
    } = {};

    if (firstLoad) {
      setState(ChartState.LOADING);
    }

    // clear any previous errors on refresh
    if (!firstLoad) {
      setError(null);
    }

    for (const plot of plots) {
      var response;
      try {
        // recalculate time range for each fetch to ensure we get current data
        const currentTimeRange = getTimeRangeAndStepSize(props.interval, props.resolution);

        response = await fetchMetrics({
          prefix: props.prometheusPrefix,
          query: plot.query,
          from: currentTimeRange.from,
          to: currentTimeRange.to,
          step: currentTimeRange.step,
          subPath: props.subPath,
        });
      } catch (e) {
        fetchedMetrics[plot.name] = { data: [], state: ChartState.ERROR };
        setError(e.message);
        setState(ChartState.ERROR);
        break;
      }
      if (response.status !== 'success') {
        fetchedMetrics[plot.name] = { data: [], state: ChartState.ERROR };
        continue;
      }

      if (response['data']['result'].length === 0) {
        fetchedMetrics[plot.name] = { data: [], state: ChartState.NO_DATA };
        continue;
      }

      const data = plot.dataProcessor(response);
      fetchedMetrics[plot.name] = { data: data, state: ChartState.SUCCESS };
    }

    // if all the plots are in no data state, set the state to no data
    if (Object.values(fetchedMetrics).every(plot => plot.state === ChartState.NO_DATA)) {
      setState(ChartState.NO_DATA);
      setMetrics([]);
    }
    // if all the plots are in success state, set the state to success
    else if (Object.values(fetchedMetrics).every(plot => plot.state === ChartState.SUCCESS)) {
      // merge the data from all the plots into a single object
      const mergedData = fetchedMetrics[Object.keys(fetchedMetrics)[0]].data.map(
        (element, index) => {
          const mergedElement = { timestamp: element.timestamp };
          for (const plotName of Object.keys(fetchedMetrics)) {
            mergedElement[plotName] = fetchedMetrics[plotName].data[index].y;
          }
          return mergedElement;
        }
      );
      setMetrics(mergedData);
      setState(ChartState.SUCCESS);
    } else {
      // default to error if any of the plots has no data or is in error state
      setState(ChartState.ERROR);
    }
  };

  // Fetch data on initial load and when key parameters change
  useEffect(() => {
    fetchMetricsData(props.plots, true);
  }, [
    props.interval,
    props.resolution,
    props.prometheusPrefix,
    props.subPath,
    JSON.stringify(props.plots),
  ]);

  // if reload is true, set up a timer to refresh data every 10 seconds
  // Set up a timer to refresh data every 10 seconds
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    if (props.autoRefresh) {
      refreshInterval = setInterval(() => {
        fetchMetricsData(props.plots, false);
      }, 10000);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [
    props.autoRefresh,
    props.interval,
    props.resolution,
    props.prometheusPrefix,
    props.subPath,
    JSON.stringify(props.plots),
  ]);

  // Calculate time range for XAxis domain
  const { from: fromTimestamp, to: toTimestamp } = getTimeRangeAndStepSize(
    props.interval,
    props.resolution
  );

  let chartContent;

  if (state === ChartState.SUCCESS) {
    chartContent = (
      <AreaChart data={metrics} style={{ fontSize: 14 }}>
        <XAxis
          stroke={theme.palette.chartStyles.labelColor}
          fontSize={12}
          {...xAxisProps}
          type="number"
          domain={[fromTimestamp, toTimestamp]}
          allowDataOverflow
        />
        <YAxis fontSize={14} stroke={theme.palette.chartStyles.labelColor} {...yAxisProps} />
        {props.CustomTooltip === undefined ? (
          <Tooltip />
        ) : (
          <Tooltip content={props.CustomTooltip} />
        )}
        <Legend />
        <CartesianGrid strokeDasharray="2 4" stroke={theme.palette.divider} vertical={false} />
        {props.plots.map(plot => (
          <Area
            key={plot.name}
            stackId="1"
            type="step"
            dataKey={plot.name}
            stroke={plot.strokeColor}
            strokeWidth={2}
            fill={plot.fillColor}
            activeDot={{ r: 2 }}
            animationDuration={props.autoRefresh ? 0 : 400} // Disable animation when refreshing
          />
        ))}
        {props.referenceLines?.map(line => (
          <ReferenceLine
            key={line.label}
            x={line.x}
            y={line.y}
            stroke="#999"
            strokeDasharray={line.strokeDasharray || '15 15'}
            label={{
              value: line.label,
              fontSize: 15,
              fill: line.stroke,
            }}
          />
        ))}
      </AreaChart>
    );
  } else if (state === ChartState.LOADING) {
    chartContent = <Loader title={t('Fetching Data')} />;
  } else if (state === ChartState.ERROR) {
    chartContent = (
      <Box
        width="100%"
        height="100%"
        p={2}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Box>
          <EmptyContent color="error">{t('Error: {{ error }}', { error })}</EmptyContent>
        </Box>
      </Box>
    );
  } else {
    chartContent = (
      <Box
        width="100%"
        height="100%"
        p={2}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Box>
          <EmptyContent>{t('No Data')}</EmptyContent>
        </Box>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      {chartContent}
    </ResponsiveContainer>
  );
}
