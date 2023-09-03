import { DetailsViewSectionProps, registerDetailsViewSection } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox, SectionHeader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, FormControlLabel,Switch } from '@material-ui/core';
import { Button, ButtonGroup } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import React, { useEffect, useState } from 'react';
import { Chart } from './chart';
import { isPrometheusInstalled } from './request';

function MetricsEnabled({ children }) {
  const [prometheusInstalled, setPrometheusInstalled] = useState<boolean>(false);
  const [promPodName, setPromPodName] = useState<string>(null);
  const [promNamespace, setPromNamespace] = useState<string>(null);
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    (async () => {
      setState('loading');
      const [isInstalled, podName, namespace] = await isPrometheusInstalled();
      setPromPodName(podName);
      setPromNamespace(namespace);
      setPrometheusInstalled(isInstalled);
      setState(null);
    })();
  }, []);

  return (
    <div>
      {prometheusInstalled ? (
        <>
          {React.cloneElement(children, {
            prometheusPrefix: `${promNamespace}/pods/${promPodName}`,
          })}
        </>
      ) : state === 'loading' ? (
        <Alert severity="info">Fetching Prometheus Info</Alert>
      ) : (
        <Alert severity="info">Prometheus is not installed</Alert>
      )}
    </div>
  );
}

function PrometheusMetrics(resource: DetailsViewSectionProps) {
  if (resource.kind === 'Pod') {
    return (
      <MetricsEnabled>
        <PodMetrics
          podName={resource.jsonData.metadata.name}
          namespace={resource.jsonData.metadata.namespace}
        />
      </MetricsEnabled>
    );
  }
  //   if (resource.kind === 'Node') {
  //     return (
  //         <MetricsEnabled>
  //             <NodeMetrics
  //                 nodeName={resource.jsonData.status.addresses[0].address}
  //             />
  //         </MetricsEnabled>
  //     )}
  return <div>not a pod</div>;
}

function PodMetrics(props: { podName: string; namespace: string }) {
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
            <CPUChart
              query={`sum(rate(container_cpu_usage_seconds_total{container!='',namespace='${props.namespace}',pod='${props.podName}'}[1m])) by (pod,namespace)`}
              autoRefresh={refresh}
              {...props}
            />
          )}
          {chartVariant === 'memory' && (
            <MemoryChart
              query={`sum(container_memory_working_set_bytes{namespace='${props.namespace}',pod=~'${props.podName}'}) by (pod,namespace)`}
              autoRefresh={refresh}
              {...props}
            />
          )}
          {chartVariant === 'network' && (
            <NetworkChart
              rxQuery={`sum(rate(container_network_receive_bytes_total{namespace='${props.namespace}',pod='${props.podName}'}[1m])) by (pod,namespace)`}
              txQuery={`sum(rate(container_network_transmit_bytes_total{namespace='${props.namespace}',pod='${props.podName}'}[1m])) by (pod,namespace)`}
              autoRefresh={refresh}
              {...props}
            />
          )}
          {chartVariant === 'filesystem' && (
            <FilesystemChart
              readQuery={`sum(rate(container_fs_reads_bytes_total{namespace='${props.namespace}',pod='${props.podName}'}[1m])) by (pod,namespace)`}
              writeQuery={`sum(rate(container_fs_writes_bytes_total{namespace='${props.namespace}',pod='${props.podName}'}[1m])) by (pod,namespace)`}
              autoRefresh={refresh}
              {...props}
            />
          )}
        </Box>
      </Box>
    </SectionBox>
  );
}

function tickTimestampFormatter(timestamp) {
  const date = new Date(timestamp * 1000);
  return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const dataPoint = payload[0]; // Assuming you have a single line on the chart
    const timestamp = new Date(label * 1000); // Convert epoch to milliseconds

    return (
      <div className="custom-tooltip">
        <p>{`Date: ${timestamp.toLocaleString()}`}</p>
        <p>{`Value: ${dataPoint.value}`}</p>
      </div>
    );
  }

  return null;
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

function CPUChart(props: { query: string; prometheusPrefix: string; autoRefresh: boolean }) {
  const XTickProps = {
    dataKey: 'timestamp',
    tickFormatter: tickTimestampFormatter,
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
          color: '#8884d8',
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

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + units[i];
}

function MemoryChart(props: { query: string; prometheusPrefix: string; autoRefresh: boolean }) {
  const XTickProps = {
    dataKey: 'timestamp',
    tickFormatter: tickTimestampFormatter,
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
          color: '#8884d8',
          dataProcessor: dataProcessor,
        },
      ]}
      XTickProps={XTickProps}
      YTickProps={YTickProps}
      CustomTooltip={({ active, payload, label }) => {
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
      }}
      {...props}
    />
  );
}

function NetworkChart(props: {
  rxQuery: string;
  txQuery: string;
  prometheusPrefix: string;
  autoRefresh: boolean;
}) {
  return (
    <Chart
      plots={[
        {
          query: props.rxQuery,
          name: 'recieve',
          color: '#8884d8',
          dataProcessor: dataProcessor,
        },
        {
          query: props.txQuery,
          name: 'transmit',
          color: '#82ca9d',
          dataProcessor: dataProcessor,
        },
      ]}
      XTickProps={{
        dataKey: 'timestamp',
        tickFormatter: tickTimestampFormatter,
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
      CustomTooltip={({ active, payload, label }) => {
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
      }}
      {...props}
    />
  );
}

function FilesystemChart(props: {
  readQuery: string;
  writeQuery: string;
  prometheusPrefix: string;
  autoRefresh: boolean;
}) {
  return (
    <Chart
      plots={[
        {
          query: props.readQuery,
          name: 'read',
          color: '#8884d8',
          dataProcessor: response => {
            const data = [];
            // convert the response to a JSON object
            response['data']['result'][0]['values'].forEach(element => {
              // convert value to a number

              data.push({ timestamp: element[0], y: Number(element[1]) });
            });
            return data;
          },
        },
        {
          query: props.writeQuery,
          name: 'write',
          color: '#82ca9d',
          dataProcessor: response => {
            const data = [];
            // convert the response to a JSON object
            response['data']['result'][0]['values'].forEach(element => {
              // convert value to a number

              data.push({ timestamp: element[0], y: Number(element[1]) });
            });
            return data;
          },
        },
      ]}
      XTickProps={{
        dataKey: 'timestamp',
        tickFormatter: tickTimestampFormatter,
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
      CustomTooltip={({ active, payload, label }) => {
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
      }}
      {...props}
    />
  );
}

registerDetailsViewSection(({ resource }: DetailsViewSectionProps) => {
  return PrometheusMetrics(resource);
});
