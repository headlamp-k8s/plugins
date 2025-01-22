import { Icon } from '@iconify/react';
import { Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useCluster } from '@kinvolk/headlamp-plugin/lib/k8s';
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Select,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import Alert from '@mui/material/Alert';
import { useEffect, useState } from 'react';
import { getConfigStore, getPrometheusInterval, getPrometheusEndpoint as getPrometheusEndpoint, PrometheusEndpoint } from '../../../util';
import { PrometheusNotFoundBanner } from '../common';
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
  const [prometheusEndpoint, setPrometheusEndpoint] = useState<PrometheusEndpoint | null>(null);
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
      setPrometheusEndpoint(null);
      return;
    }

    setState(prometheusState.LOADING);
    (async () => {
      try {
        const endpoint = await getPrometheusEndpoint(cluster);
        if (endpoint) {
          setPrometheusEndpoint(endpoint);
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

  const interval = getPrometheusInterval(cluster);

  const [timespan, setTimespan] = useState(interval ?? '1h');

  if (!isVisible) {
    return null;
  }

  return (
    <SectionBox>
      <Paper variant="outlined" sx={{ p: 1 }}>
        {state === prometheusState.INSTALLED && (
          <Box display="flex" gap={1} justifyContent="flex-end" mb={2}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setRefresh(refresh => !refresh);
              }}
              startIcon={<Icon icon={refresh ? 'mdi:pause' : 'mdi:play'} />}
              sx={{ filter: 'grayscale(1.0)' }}
            >
              {refresh ? 'Pause' : 'Resume'}
            </Button>
            <ToggleButtonGroup
              onChange={handleChartVariantChange}
              size="small"
              aria-label="metric chooser"
              value={chartVariant}
              exclusive
            >
              <CustomToggleButton label="CPU" value="cpu" icon="mdi:chip" />
              <CustomToggleButton label="Memory" value="memory" icon="mdi:memory" />
              <CustomToggleButton
                label="Network"
                value="network"
                icon="mdi:folder-network-outline"
              />
              <CustomToggleButton label="Filesystem" value="filesystem" icon="mdi:database" />
            </ToggleButtonGroup>
            <Box>
              <Select
                variant="outlined"
                size="small"
                name="Time"
                value={timespan}
                onChange={e => setTimespan(e.target.value)}
              >
                <MenuItem value={'10m'}>10 minutes</MenuItem>
                <MenuItem value={'30m'}>30 minutes</MenuItem>
                <MenuItem value={'1h'}>1 hour</MenuItem>
                <MenuItem value={'3h'}>3 hours</MenuItem>
                <MenuItem value={'6h'}>6 hours</MenuItem>
                <MenuItem value={'12h'}>12 hours</MenuItem>
                <MenuItem value={'24h'}>24 hours</MenuItem>
                <MenuItem value={'48h'}>48 hours</MenuItem>
                <MenuItem value={'today'}>Today</MenuItem>
                <MenuItem value={'yesterday'}>Yesterday</MenuItem>
                <MenuItem value={'week'}>Week</MenuItem>
                <MenuItem value={'lastweek'}>Last week</MenuItem>
                <MenuItem value={'7d'}>7 days</MenuItem>
                <MenuItem value={'14d'}>14 days</MenuItem>
              </Select>
            </Box>
          </Box>
        )}
        {state === prometheusState.INSTALLED ? (
          <Box
            style={{
              height: '400px',
            }}
          >
            {chartVariant === 'cpu' && (
              <CPUChart
                query={props.cpuQuery}
                autoRefresh={refresh}
                interval={timespan}
                prometheusEndpoint={prometheusEndpoint}
              />
            )}
            {chartVariant === 'memory' && (
              <MemoryChart
                query={props.memoryQuery}
                autoRefresh={refresh}
                interval={timespan}
                prometheusEndpoint={prometheusEndpoint}
              />
            )}
            {chartVariant === 'network' && (
              <NetworkChart
                rxQuery={props.networkRxQuery}
                txQuery={props.networkTxQuery}
                autoRefresh={refresh}
                interval={timespan}
                prometheusEndpoint={prometheusEndpoint}
              />
            )}
            {chartVariant === 'filesystem' && (
              <FilesystemChart
                readQuery={props.filesystemReadQuery}
                writeQuery={props.filesystemWriteQuery}
                autoRefresh={refresh}
                interval={timespan}
                prometheusEndpoint={prometheusEndpoint}
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
          <PrometheusNotFoundBanner />
        )}
      </Paper>
    </SectionBox>
  );
}

function CustomToggleButton({
  label,
  icon,
  value,
}: {
  label: string;
  icon: string;
  value: string;
}) {
  return (
    <ToggleButton size="small" value={value} sx={{ textTransform: 'none', gap: 0.5, fontSize: 14 }}>
      <Icon icon={icon} width="18px" />
      {label}
    </ToggleButton>
  );
}
