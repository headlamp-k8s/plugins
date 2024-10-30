import { Icon } from '@iconify/react';
import { Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useCluster } from '@kinvolk/headlamp-plugin/lib/k8s';
import { Box, IconButton, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import Alert from '@mui/material/Alert';
import { useEffect, useState } from 'react';
import { getConfigStore, getPrometheusInterval, getPrometheusPrefix } from '../../../util';
import { InstallPrometheusBanner } from '../common';
import { CPUChart } from '../CPUChart/CPUChart';
import { FilesystemChart } from '../FilesystemChart/FilesystemChart';
import { MemoryChart } from '../MemoryChart/MemoryChart';
import { NetworkChart } from '../NetworkChart/NetworkChart';

/**
 * Props for the GenericMetricsChart component
 * @interface GenericMetricsChartProps
 * @property {string} cpuQuery - The Prometheus query to fetch CPU metrics
 * @property {string} memoryQuery - The Prometheus query to fetch memory metrics
 * @property {string} networkRxQuery - The Prometheus query to fetch network receive metrics
 * @property {string} networkTxQuery - The Prometheus query to fetch network transmit metrics
 * @property {string} filesystemReadQuery - The Prometheus query to fetch filesystem read metrics
 * @property {string} filesystemWriteQuery - The Prometheus query to fetch filesystem write metrics
 */
interface GenericMetricsChartProps {
  cpuQuery: string;
  memoryQuery: string;
  networkRxQuery: string;
  networkTxQuery: string;
  filesystemReadQuery: string;
  filesystemWriteQuery: string;
}

export function GenericMetricsChart(props: GenericMetricsChartProps) {
  enum prometheusState {
    UNKNOWN,
    LOADING,
    ERROR,
    INSTALLED,
  }

  const [chartVariant, setChartVariant] = useState<string>('cpu');
  const [refresh, setRefresh] = useState<boolean>(true);
  const [state, setState] = useState<prometheusState>(prometheusState.LOADING);
  const [prometheusPrefix, setPrometheusPrefix] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const cluster = useCluster();
  const configStore = getConfigStore();
  const useClusterConfig = configStore.useConfig();
  const clusterConfig = useClusterConfig();

  useEffect(() => {
    const isEnabled = clusterConfig?.[cluster]?.isMetricsEnabled || false;
    setIsVisible(isEnabled);

    console.log('clusterConfig', clusterConfig);
    console.log('isEnabled', isEnabled);

    if (!isEnabled) {
      setState(prometheusState.UNKNOWN);
      setPrometheusPrefix(null);
      return;
    }

    setState(prometheusState.LOADING);
    (async () => {
      try {
        const prefix = await getPrometheusPrefix(cluster);
        if (prefix) {
          setPrometheusPrefix(prefix);
          setState(prometheusState.INSTALLED);
        } else {
          setState(prometheusState.UNKNOWN);
        }
      } catch (e) {
        setState(prometheusState.ERROR);
      }
    })();
  }, [clusterConfig, cluster]);

  const handleChartVariantChange = (event: React.MouseEvent<HTMLButtonElement>) => {
    setChartVariant(event.currentTarget.value);
  };

  if (!isVisible) {
    return null;
  }

  const interval = getPrometheusInterval(cluster);

  return (
    <SectionBox>
      <Box
        display="flex"
        justifyContent="space-around"
        alignItems="center"
        style={{ marginBottom: '1rem', margin: '0 auto', width: '0' }}
      >
        {state === prometheusState.INSTALLED
          ? [
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
                  size="large"
                >
                  {refresh ? (
                    <Tooltip title="Pause metrics">
                      {' '}
                      <Icon icon="mdi:pause" />{' '}
                    </Tooltip>
                  ) : (
                    <Tooltip title="Resume metrics">
                      {' '}
                      <Icon icon="mdi:play" />{' '}
                    </Tooltip>
                  )}
                </IconButton>
              </Box>,
            ]
          : []}
      </Box>

      {state === prometheusState.INSTALLED ? (
        <Box
          style={{
            justifyContent: 'center',
            display: 'flex',
            height: '40vh',
            width: '80%',
            margin: '0 auto',
          }}
        >
          {chartVariant === 'cpu' && (
            <CPUChart
              query={props.cpuQuery}
              autoRefresh={refresh}
              prometheusPrefix={prometheusPrefix}
              interval={interval}
            />
          )}
          {chartVariant === 'memory' && (
            <MemoryChart
              query={props.memoryQuery}
              autoRefresh={refresh}
              prometheusPrefix={prometheusPrefix}
              interval={interval}
            />
          )}
          {chartVariant === 'network' && (
            <NetworkChart
              rxQuery={props.networkRxQuery}
              txQuery={props.networkTxQuery}
              autoRefresh={refresh}
              interval={interval}
              prometheusPrefix={prometheusPrefix}
            />
          )}
          {chartVariant === 'filesystem' && (
            <FilesystemChart
              readQuery={props.filesystemReadQuery}
              writeQuery={props.filesystemWriteQuery}
              autoRefresh={refresh}
              interval={interval}
              prometheusPrefix={prometheusPrefix}
            />
          )}
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
        <InstallPrometheusBanner />
      )}
    </SectionBox>
  );
}
