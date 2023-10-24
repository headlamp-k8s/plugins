import { Icon } from '@iconify/react';
import { Loader, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Box,
  Button,
  Grid,
  IconButton,
  Link,
  makeStyles,
  Paper,
  Typography,
} from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import React, { useEffect, useState } from 'react';
import skeletonImg from '../assets/chart-skeleton.png';
import { Chart } from './chart';
import { isPrometheusInstalled } from './request';
import { usePluginSettings } from './util';

const learnMoreLink = 'https://github.com/headlamp-k8s/plugins/tree/main/prometheus#readme';

const useStyles = makeStyles(theme => ({
  skeletonBox: {
    backgroundImage: `url(${skeletonImg})`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPositionX: 'center',
    height: '450px',
  },
  dismissButton: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      color: theme.palette.primary.text,
    },
  },
}));

export function GenericMetricsChart(props: {
  cpuQuery: string;
  memoryQuery: string;
  networkRxQuery: string;
  networkTxQuery: string;
  filesystemReadQuery: string;
  filesystemWriteQuery: string;
}) {
  enum prometheusState {
    UNKNOWN,
    LOADING,
    ERROR,
    INSTALLED,
  }

  const classes = useStyles();
  const pluginSettings = usePluginSettings();
  const [chartVariant, setChartVariant] = useState<string>('cpu');
  const [refresh, setRefresh] = useState<boolean>(true);

  const [prometheusInfo, setPrometheusInfo] = useState<{
    podName: string;
    podNamespace: string;
  } | null>(null);
  const [state, setState] = useState<prometheusState>(prometheusState.LOADING);

  useEffect(() => {
    (async () => {
      try {
        const [isInstalled, podName, namespace] = await isPrometheusInstalled();
        if (isInstalled) {
          setPrometheusInfo({ podName, podNamespace: namespace });
          setState(prometheusState.INSTALLED);
        } else {
          setPrometheusInfo(null);
          setState(prometheusState.UNKNOWN);
        }
      } catch (e) {
        setState(prometheusState.ERROR);
        return;
      }
    })();
  }, []);

  const handleChartVariantChange = (event: React.MouseEvent<HTMLButtonElement>) => {
    setChartVariant(event.currentTarget.value);
  };

  if (!pluginSettings.isVisible) {
    return null;
  }

  return (
    <SectionBox>
      <Box
        display="flex"
        justifyContent="space-around"
        alignItems="center"
        style={{ marginBottom: '1rem', maxWidth: '900px' }}
      >
        {state === prometheusState.INSTALLED
          ? [
              <Box></Box>, // This Box is just for leveling the buttons alignment
              <ToggleButtonGroup
                onChange={handleChartVariantChange}
                size="small"
                aria-label="metric chooser"
                value={chartVariant}
                exclusive
              >
                <ToggleButton value="cpu">CPU</ToggleButton>
                <ToggleButton value="memory">Memory</ToggleButton>
                <ToggleButton value="network">Network</ToggleButton>
                <ToggleButton value="filesystem">Filesystem</ToggleButton>
              </ToggleButtonGroup>,
              <Box pl={2}>
                <IconButton
                  onClick={() => {
                    setRefresh(refresh => !refresh);
                  }}
                >
                  {refresh ? <Icon icon="mdi:pause" /> : <Icon icon="mdi:play" />}
                </IconButton>
              </Box>,
            ]
          : []}
      </Box>

      {prometheusInfo ? (
        <Box style={{ justifyContent: 'center', display: 'flex' }}>
          <Box container spacing={2} style={{ height: '40vh', width: '80%' }}>
            {chartVariant === 'cpu' && (
              <CPUChart
                query={props.cpuQuery}
                autoRefresh={refresh}
                prometheusPrefix={`${prometheusInfo.podNamespace}/pods/${prometheusInfo.podName}`}
              />
            )}
            {chartVariant === 'memory' && (
              <MemoryChart
                query={props.memoryQuery}
                autoRefresh={refresh}
                prometheusPrefix={`${prometheusInfo.podNamespace}/pods/${prometheusInfo.podName}`}
              />
            )}
            {chartVariant === 'network' && (
              <NetworkChart
                rxQuery={props.networkRxQuery}
                txQuery={props.networkTxQuery}
                autoRefresh={refresh}
                prometheusPrefix={`${prometheusInfo.podNamespace}/pods/${prometheusInfo.podName}`}
              />
            )}
            {chartVariant === 'filesystem' && (
              <FilesystemChart
                readQuery={props.filesystemReadQuery}
                writeQuery={props.filesystemWriteQuery}
                autoRefresh={refresh}
                prometheusPrefix={`${prometheusInfo.podNamespace}/pods/${prometheusInfo.podName}`}
              />
            )}
          </Box>
        </Box>
      ) : state === prometheusState.LOADING ? (
        <Box m={2}>
          <Loader title="Loading Prometheus Info" />
        </Box>
      ) : state === prometheusState.ERROR ? (
        <Box m={2}>
          <Alert severity="warning">Error fetching prometheus Info</Alert>
        </Box>
      ) : (
        <Grid
          container
          spacing={2}
          direction="column"
          justifyContent="center"
          alignItems="center"
          className={classes.skeletonBox}
        >
          <Grid item>
            <Typography variant="h5">Install Prometheus for accessing metrics charts</Typography>
          </Grid>
          <Grid item>
            <Typography>
              <Link href={learnMoreLink} target="_blank">
                Learn more about enabling advanced charts.
              </Link>
            </Typography>
          </Grid>
          <Grid item>
            <Button
              className={classes.dismissButton}
              size="small"
              variant="contained"
              onClick={() => pluginSettings.setIsVisible(false)}
            >
              Dismiss
            </Button>
          </Grid>
        </Grid>
      )}
    </SectionBox>
  );
}

function createTickTimestampFormatter() {
  let prevRenderedTimestamp = null;

  return function (timestamp) {
    const date = new Date(timestamp * 1000);
    const currentTimestamp = `${date.getHours()}:${date.getMinutes()}`;

    // Check if the current timestamp is different from the previously rendered one
    const shouldRenderDate = currentTimestamp !== prevRenderedTimestamp;

    // Update the previous timestamp
    prevRenderedTimestamp = currentTimestamp;

    return shouldRenderDate ? `${date.getHours()}:${date.getMinutes()}` : '';
  };
}

function dataProcessor(response: any): { timestamp: number; y: number }[] {
  const data: { timestamp: number; y: number }[] = [];
  // convert the response to a JSON object
  response?.data?.result?.[0]?.values.forEach(element => {
    // convert value to a number
    data.push({ timestamp: element[0], y: Number(element[1]) });
  });
  return data;
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const timestamp = new Date(label * 1000); // Convert epoch to milliseconds

    return (
      <div className="custom-tooltip">
        <Paper>
          <Box p={2}>
            <p>{`Date: ${timestamp.toLocaleString()}`}</p>
            {payload.map(data => (
              <p>{`${data.name}: ${data.value}`}</p>
            ))}
          </Box>
        </Paper>
      </div>
    );
  }

  return null;
}

function CustomTooltipFormatBytes({ active, payload, label }) {
  if (active && payload && payload.length) {
    const timestamp = new Date(label * 1000); // Convert epoch to milliseconds

    return (
      <div className="custom-tooltip">
        <Paper>
          <Box p={2}>
            <p>{`Date: ${timestamp.toLocaleString()}`}</p>
            {payload.map(data => (
              <p>{`${data.name}: ${formatBytes(data.value)}`}</p>
            ))}
          </Box>
        </Paper>
      </div>
    );
  }

  return null;
}

function formatBytes(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + units[i];
}

export function CPUChart(props: { query: string; prometheusPrefix: string; autoRefresh: boolean }) {
  const xTickFormatter = createTickTimestampFormatter();

  const XTickProps = {
    dataKey: 'timestamp',
    tickLine: false,
    tick: props => {
      const value = xTickFormatter(props.payload.value);
      return (
        value !== '' && (
          <g transform={`translate(${props.x},${props.y})`}>
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
  };

  return (
    <Chart
      plots={[
        {
          query: props.query,
          name: 'cpu (cores)',
          strokeColor: '#7160BB',
          fillColor: '#C2B0FF',
          dataProcessor: dataProcessor,
        },
      ]}
      XTickProps={XTickProps}
      YTickProps={YTickProps}
      CustomTooltip={CustomTooltip}
      {...props}
    />
  );
}

export function MemoryChart(props: {
  query: string;
  prometheusPrefix: string;
  autoRefresh: boolean;
}) {
  const xTickFormatter = createTickTimestampFormatter();

  const XTickProps = {
    dataKey: 'timestamp',
    tickLine: false,
    tick: props => {
      const value = xTickFormatter(props.payload.value);
      return (
        value !== '' && (
          <g transform={`translate(${props.x},${props.y})`}>
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
      <g transform={`translate(${x},${y})`}>
        <text x={-25} y={0} dy={0} textAnchor="middle">
          {formatBytes(payload.value)}
        </text>
      </g>
    ),
  };

  return (
    <Chart
      plots={[
        {
          query: props.query,
          name: 'memory',
          strokeColor: '#7160BB',
          fillColor: '#C2B0FF',
          dataProcessor: dataProcessor,
        },
      ]}
      XTickProps={XTickProps}
      YTickProps={YTickProps}
      CustomTooltip={CustomTooltipFormatBytes}
      {...props}
    />
  );
}

export function NetworkChart(props: {
  rxQuery: string;
  txQuery: string;
  prometheusPrefix: string;
  autoRefresh: boolean;
}) {
  const xTickFormatter = createTickTimestampFormatter();

  return (
    <Chart
      plots={[
        {
          query: props.rxQuery,
          name: 'recieve',
          strokeColor: '#7160BB',
          fillColor: '#C2B0FF',
          dataProcessor: dataProcessor,
        },
        {
          query: props.txQuery,
          name: 'transmit',
          strokeColor: '#0079D4',
          fillColor: '#0079D4',
          dataProcessor: dataProcessor,
        },
      ]}
      XTickProps={{
        dataKey: 'timestamp',
        tickLine: false,
        tick: props => {
          const value = xTickFormatter(props.payload.value);
          return (
            value !== '' && (
              <g transform={`translate(${props.x},${props.y})`}>
                <text x={0} y={10} dy={0} textAnchor="middle">
                  {value}
                </text>
              </g>
            )
          );
        },
      }}
      YTickProps={{
        domain: ['dataMin', 'auto'],
        tick: ({ x, y, payload }) => (
          <g transform={`translate(${x},${y})`}>
            <text x={-25} y={0} dy={0} textAnchor="middle">
              {formatBytes(payload.value)}
            </text>
          </g>
        ),
      }}
      CustomTooltip={CustomTooltipFormatBytes}
      {...props}
    />
  );
}

export function FilesystemChart(props: {
  readQuery: string;
  writeQuery: string;
  prometheusPrefix: string;
  autoRefresh: boolean;
}) {
  const xTickFormatter = createTickTimestampFormatter();

  return (
    <Chart
      plots={[
        {
          query: props.readQuery,
          name: 'read',
          strokeColor: '#7160BB',
          fillColor: '#C2B0FF',
          dataProcessor: dataProcessor,
        },
        {
          query: props.writeQuery,
          name: 'write',
          strokeColor: '#0079D4',
          fillColor: '#0079D4',
          dataProcessor: dataProcessor,
        },
      ]}
      XTickProps={{
        dataKey: 'timestamp',
        tickLine: false,
        tick: props => {
          const value = xTickFormatter(props.payload.value);
          return (
            value !== '' && (
              <g transform={`translate(${props.x},${props.y})`}>
                <text x={0} y={10} dy={0} textAnchor="middle">
                  {value}
                </text>
              </g>
            )
          );
        },
      }}
      YTickProps={{
        domain: ['dataMin', 'auto'],
        tick: ({ x, y, payload }) => (
          <g transform={`translate(${x},${y})`}>
            <text x={-25} y={0} dy={0} textAnchor="middle">
              {formatBytes(payload.value)}
            </text>
          </g>
        ),
      }}
      CustomTooltip={CustomTooltipFormatBytes}
      {...props}
    />
  );
}
