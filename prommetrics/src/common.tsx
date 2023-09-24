import { Chart } from './chart';
import { SectionBox, SectionHeader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, FormControlLabel, Switch } from '@material-ui/core';
import { Button, ButtonGroup } from '@material-ui/core';
import { useState } from 'react';

export function GenericMetricsChart(props: {
  cpuQuery: string;
  memoryQuery: string;
  networkRxQuery: string;
  networkTxQuery: string;
  filesystemReadQuery: string;
  filesystemWriteQuery: string;
}) {
  const [chartVariant, setChartVariant] = useState<string>('cpu');
  const [refresh, setRefresh] = useState<boolean>(true);

  const handleChartVariantChange = (event: React.MouseEvent<HTMLButtonElement>) => {
    setChartVariant(event.currentTarget.value);
  };

  return (
    <SectionBox>
      <SectionHeader
        title="Metrics"
        actions={[
          <FormControlLabel
            control={
              <Switch
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setRefresh(event.target.checked);
                }}
                checked={refresh}
                name="Auto Refresh"
              />
            }
            label="Auto Refresh"
          />,
          <ButtonGroup size="small" aria-label="small outlined button group">
            <Button
              value="cpu"
              onClick={handleChartVariantChange}
              variant={chartVariant === 'cpu' ? 'contained' : 'outlined'}
            >
              CPU
            </Button>
            <Button
              value="memory"
              onClick={handleChartVariantChange}
              variant={chartVariant === 'memory' ? 'contained' : 'outlined'}
            >
              Memory
            </Button>
            <Button
              value="network"
              onClick={handleChartVariantChange}
              variant={chartVariant === 'network' ? 'contained' : 'outlined'}
            >
              Network
            </Button>
            <Button
              value="filesystem"
              onClick={handleChartVariantChange}
              variant={chartVariant === 'filesystem' ? 'contained' : 'outlined'}
            >
              Filesystem
            </Button>
          </ButtonGroup>,
        ]}
      />

      <Box style={{ justifyContent: 'center', display: 'flex' }}>
        <Box container spacing={2} style={{ height: '40vh', width: '80%' }}>
          {chartVariant === 'cpu' && (
            <CPUChart query={props.cpuQuery} autoRefresh={refresh} {...props} />
          )}
          {chartVariant === 'memory' && (
            <MemoryChart query={props.memoryQuery} autoRefresh={refresh} {...props} />
          )}
          {chartVariant === 'network' && (
            <NetworkChart
              rxQuery={props.networkRxQuery}
              txQuery={props.networkTxQuery}
              autoRefresh={refresh}
              {...props}
            />
          )}
          {chartVariant === 'filesystem' && (
            <FilesystemChart
              readQuery={props.filesystemReadQuery}
              writeQuery={props.filesystemWriteQuery}
              autoRefresh={refresh}
              {...props}
            />
          )}
        </Box>
      </Box>
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

    console.log('debug:', currentTimestamp, prevRenderedTimestamp);
    // Update the previous timestamp
    prevRenderedTimestamp = currentTimestamp;

    return shouldRenderDate ? `${date.getHours()}:${date.getMinutes()}` : '';
  };
}

function dataProcessor(response: any): any[] {
  const data = [];
  // convert the response to a JSON object
  response['data']['result'][0]['values'].forEach(element => {
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
        <p>{`Date: ${timestamp.toLocaleString()}`}</p>
        {payload.map(data => (
          <p>{`${data.name}: ${data.value}`}</p>
        ))}
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
        <p>{`Date: ${timestamp.toLocaleString()}`}</p>
        {payload.map(data => (
          <p>{`${data.name}: ${formatBytes(data.value)}`}</p>
        ))}
      </div>
    );
  }

  return null;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + units[i];
}

export function CPUChart(props: { query: string; prometheusPrefix: string; autoRefresh: boolean }) {
  const xTickFormatter = createTickTimestampFormatter();

  const XTickProps = {
    dataKey: 'timestamp',
    tick: ({ x, y, payload }) => {
      const value = xTickFormatter(x);

      return (
        value !== '' && (
          <g transform={`translate(${x},${y})`}>
            <text x={0} y={10} dy={0} textAnchor="middle" fill="#666">
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
          name: 'cpu',
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
    tick: ({ x, y, payload }) => {
      const value = xTickFormatter(x);

      return (
        value !== '' && (
          <g transform={`translate(${x},${y})`}>
            <text x={0} y={10} dy={0} textAnchor="middle" fill="#666">
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
        <text x={-25} y={0} dy={0} textAnchor="middle" fill="#666">
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
        tick: ({ x, y, payload }) => {
          const value = xTickFormatter(x);

          return (
            value !== '' && (
              <g transform={`translate(${x},${y})`}>
                <text x={0} y={10} dy={0} textAnchor="middle" fill="#666">
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
            <text x={-25} y={0} dy={0} textAnchor="middle" fill="#666">
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
        tick: ({ x, y, payload }) => {
          const value = xTickFormatter(x);

          return (
            value !== '' && (
              <g transform={`translate(${x},${y})`}>
                <text x={0} y={10} dy={0} textAnchor="middle" fill="#666">
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
            <text x={-25} y={0} dy={0} textAnchor="middle" fill="#666">
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
