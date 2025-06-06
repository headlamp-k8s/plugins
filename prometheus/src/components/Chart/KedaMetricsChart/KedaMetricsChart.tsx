import { Icon } from '@iconify/react';
import { Loader, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useCluster } from '@kinvolk/headlamp-plugin/lib/k8s';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import { useEffect, useState } from 'react';
import {
  getConfigStore,
  getPrometheusInterval,
  getPrometheusPrefix,
  getPrometheusResolution,
  getPrometheusSubPath,
} from '../../../util';
import { PrometheusNotFoundBanner } from '../common';
import { KedaScalerChart } from '../KedaScalerChart/KedaScalerChart';

/**
 * Props for the KedaMetricsChart component
 * @interface KedaMetricsChartProps
 * @property {string} scalerMetricsQuery - The Prometheus query to fetch KEDA Scaler Metrics Value
 * @property {string} hpaReplicasQuery - The Prometheus query to fetch HPA Replicas Count
 * @property {string} activeJobsQuery - The Prometheus query to fetch Active Jobs Count
 * @property {number} minReplicaCount - Minimum Replica Count as specified in the YAML Spec of KEDA Resource
 * @property {number} maxReplicaCount - Maximum Replica Count as specified in the YAML Spec of KEDA Resource
 */
export interface KedaMetricsChartProps {
  scalerMetricsQuery: string;
  hpaReplicasQuery?: string;
  activeJobsQuery?: string;
  minReplicaCount: number;
  maxReplicaCount: number;
}

export function KedaMetricsChart(props: KedaMetricsChartProps) {
  enum prometheusState {
    UNKNOWN,
    LOADING,
    ERROR,
    INSTALLED,
  }

  const cluster = useCluster();
  const configStore = getConfigStore();
  const useClusterConfig = configStore.useConfig();
  const clusterConfig = useClusterConfig();

  const [refresh, setRefresh] = useState<boolean>(true);
  const [prometheusPrefix, setPrometheusPrefix] = useState<string | null>(null);
  const [state, setState] = useState<prometheusState>(prometheusState.LOADING);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const isEnabled = clusterConfig?.[cluster]?.isMetricsEnabled || false;
    setIsVisible(isEnabled);

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
        console.error('Error checking Prometheus installation:', e);
        setState(prometheusState.ERROR);
      }
    })();
  }, [clusterConfig, cluster]);

  const interval = getPrometheusInterval(cluster);
  const graphResolution = getPrometheusResolution(cluster);
  const subPath = getPrometheusSubPath(cluster);

  const [timespan, setTimespan] = useState(interval ?? '1h');
  const [resolution, setResolution] = useState(graphResolution ?? 'medium');

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
            <Box>
              <Select
                variant="outlined"
                size="small"
                name="Time"
                value={resolution}
                onChange={e => setResolution(e.target.value)}
              >
                <ListSubheader>Automatic resolution</ListSubheader>
                <MenuItem value="low">Low res.</MenuItem>
                <MenuItem value="medium">Medium res.</MenuItem>
                <MenuItem value="high">High res.</MenuItem>

                <ListSubheader>Fixed resolution</ListSubheader>
                <MenuItem value="10s">10s</MenuItem>
                <MenuItem value="30s">30s</MenuItem>
                <MenuItem value="1m">1m</MenuItem>
                <MenuItem value="5m">5m</MenuItem>
                <MenuItem value="15m">15m</MenuItem>
                <MenuItem value="1h">1h</MenuItem>
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
            <KedaScalerChart
              autoRefresh={refresh}
              prometheusPrefix={prometheusPrefix}
              interval={timespan}
              resolution={resolution}
              subPath={subPath}
              {...props}
            />
          </Box>
        ) : state === prometheusState.LOADING ? (
          <Box m={2}>
            <Loader title="Loading Prometheus Info" />
          </Box>
        ) : state === prometheusState.ERROR ? (
          <Box m={2}>
            <Alert severity="warning">Error fetching Prometheus Info</Alert>
          </Box>
        ) : (
          <PrometheusNotFoundBanner />
        )}
      </Paper>
    </SectionBox>
  );
}
