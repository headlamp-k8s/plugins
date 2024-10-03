import { EmptyContent, Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { Area, AreaChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

/**
 * Calculates the time range based on the given interval.
 * @param {string} interval - The time interval (e.g., '10m', '1h', '24h', 'week').
 * @returns {Object} An object containing the 'from' timestamp, 'to' timestamp, and 'step' in seconds.
 */
export function getTimeRange(interval: string): { from: number; to: number; step: number } {
  const now = Math.floor(Date.now() / 1000);
  const day = 86400; // seconds in a day

  switch (interval) {
    case '10m':
      return { from: now - 600, to: now, step: 15 }; // 15 seconds step
    case '30m':
      return { from: now - 1800, to: now, step: 30 }; // 30 seconds step
    case '1h':
      return { from: now - 3600, to: now, step: 60 }; // 1 minute step
    case '3h':
      return { from: now - 10800, to: now, step: 180 }; // 3 minutes step
    case '6h':
      return { from: now - 21600, to: now, step: 360 }; // 6 minutes step
    case '12h':
      return { from: now - 43200, to: now, step: 720 }; // 12 minutes step
    case '24h':
      return { from: now - day, to: now, step: 300 }; // 5 minutes step
    case '48h':
      return { from: now - 2 * day, to: now, step: 600 }; // 10 minutes step
    case 'today':
      return { from: now - (now % day), to: now, step: 300 }; // 5 minutes step
    case 'yesterday':
      return { from: now - (now % day) - day, to: now - (now % day), step: 300 }; // 5 minutes step
    case 'week':
      return { from: now - 7 * day, to: now, step: 3600 }; // 1 hour step
    case 'lastweek':
      return { from: now - 14 * day, to: now - 7 * day, step: 3600 }; // 1 hour step
    case '7d':
      return { from: now - 7 * day, to: now, step: 3600 }; // 1 hour step
    case '14d':
      return { from: now - 14 * day, to: now, step: 7200 }; // 2 hours step
    default:
      return { from: now - 600, to: now, step: 15 }; // Default to 10 minutes with 15 seconds step
  }
}

export interface ChartProps {
  plots: Array<{
    query: string;
    name: string;
    fillColor: string;
    strokeColor: string;
    dataProcessor: (data: any) => any[];
  }>;
  fetchMetrics: (query: object) => Promise<any>;
  interval: string;
  prometheusPrefix: string;
  autoRefresh: boolean;
  xAxisProps: {
    [key: string]: any;
  };
  yAxisProps: {
    [key: string]: any;
  };
  CustomTooltip?: ({ active, payload, label }) => JSX.Element | null;
}

export function Chart(props: ChartProps) {
  enum ChartState {
    LOADING,
    ERROR,
    NO_DATA,
    SUCCESS,
  }
  const { fetchMetrics, xAxisProps, yAxisProps } = props;
  const [metrics, setMetrics] = useState<object>({});
  const [state, setState] = useState<ChartState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  const fetchMetricsData = async (
    plots: Array<{ query: string; name: string; dataProcessor: (data: any) => any }>,
    firstLoad: boolean = false
  ) => {
    const { from, to, step } = getTimeRange(props.interval);

    const fetchedMetrics: {
      [key: string]: {
        data: { timestamp: number; y: number }[];
        state: ChartState;
      };
    } = {};

    if (firstLoad) {
      setState(ChartState.LOADING);
    }
    for (const plot of plots) {
      var response;
      try {
        response = await fetchMetrics({
          prefix: props.prometheusPrefix,
          query: plot.query,
          from: from,
          to: to,
          step: step,
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

  // Fetch data on initial load
  useEffect(() => {
    fetchMetricsData(props.plots, true);
  }, []);

  // if reload is true, set up a timer to refresh data every 10 seconds
  // Set up a timer to refresh data every 10 seconds
  useEffect(() => {
    if (props.autoRefresh) {
      const refreshInterval = setInterval(() => {
        fetchMetricsData(props.plots, false);
      }, 10000);

      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [props.autoRefresh, props.plots]);

  let chartContent;

  if (state === ChartState.SUCCESS) {
    chartContent = (
      <AreaChart data={metrics}>
        <XAxis stroke={theme.palette.chartStyles.labelColor} {...xAxisProps} />
        <YAxis stroke={theme.palette.chartStyles.labelColor} {...yAxisProps} />
        {props.CustomTooltip === undefined ? (
          <Tooltip />
        ) : (
          <Tooltip content={props.CustomTooltip} />
        )}
        <Legend />
        {props.plots.map(plot => (
          <Area
            stackId="1"
            type="monotone"
            dataKey={plot.name}
            stroke={plot.strokeColor}
            fill={plot.fillColor}
            activeDot={{ r: 8 }}
            animationDuration={props.autoRefresh ? 0 : 400} // Disable animation when refreshing
          />
        ))}
      </AreaChart>
    );
  } else if (state === ChartState.LOADING) {
    chartContent = <Loader title="Fetching Data" />;
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
          <EmptyContent color="error">Error: {error}</EmptyContent>
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
          <EmptyContent>No Data</EmptyContent>
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
