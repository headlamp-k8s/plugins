import { Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box,Typography } from '@material-ui/core';
import { useEffect, useState } from 'react';
import { Area, AreaChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchMetrics } from './request';

export function Chart(props: {
  plots: Array<{
    query: string;
    name: string;
    fillColor: string;
    strokeColor: string;
    dataProcessor: (data: any) => any[];
  }>;
  prometheusPrefix: string;
  autoRefresh: boolean;
  XTickProps: {} | null;
  YTickProps: {} | null;
  CustomTooltip?: ({ active, payload, label }) => JSX.Element | null;
}) {
  //
  const [metrics, setMetrics] = useState<any>({});
  const [state, setState] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const fetchMetricsData = async (
    plots: Array<{ query: string; name: string; dataProcessor: (data: any) => any }>,
    firstLoad: boolean = false
  ) => {
    // Get the current time in milliseconds since the epoch
    const currentTime = Date.now() / 1000;

    // Calculate the time that was 10 minutes before the current time
    const tenMinutesInMilliseconds = 10 * 60; // 10 minutes in milliseconds
    const tenMinutesBefore = currentTime - tenMinutesInMilliseconds;

    const fetchedMetrics = {};

    if (firstLoad) {
      setState('loading');
    }
    try {
      for (const plot of plots) {
        const response = await fetchMetrics(
          props.prometheusPrefix,
          plot.query,
          `${tenMinutesBefore}`,
          `${currentTime}`,
          `${2}`
        );

        if (response.status !== 'success') {
          fetchedMetrics[plot.name] = { data: [], state: 'error' };
          continue;
        }

        if (response['data']['result'].length === 0) {
          fetchedMetrics[plot.name] = { data: [], state: 'no data' };
          continue;
        }

        const data = plot.dataProcessor(response);
        fetchedMetrics[plot.name] = { data: data, state: 'success' };
      }

      // if all the plots are in error state, set the state to error
      if (Object.values(fetchedMetrics).every(plot => plot.state === 'error')) {
        setState('error');
      }
      // if all the plots are in no data state, set the state to no data
      else if (Object.values(fetchedMetrics).every(plot => plot.state === 'no data')) {
        setState('no data');
      }
      // if all the plots are in success state, set the state to success
      else if (Object.values(fetchedMetrics).every(plot => plot.state === 'success')) {
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
        setState('success');
      }
    } catch (e) {
      setError(e);
      setState('error');
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

  if (state === 'success') {
    chartContent = (
      <AreaChart data={metrics}>
        {props.XTickProps === null ? <XAxis /> : <XAxis {...props.XTickProps} />}
        {props.YTickProps === null ? <YAxis /> : <YAxis {...props.YTickProps} />}
        {props.CustomTooltip === undefined ? (
          <Tooltip />
        ) : (
          <Tooltip content={<props.CustomTooltip />} />
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
  } else if (state === 'loading') {
    chartContent = <Loader title="Fetching Data" />;
  } else if (state === 'error') {
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
          <Typography variant="h5">Error:{error}</Typography>
          </Box>
      </Box>
    )
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
          <Typography variant="h5">No Data</Typography>
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
