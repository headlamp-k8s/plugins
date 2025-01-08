import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useCluster } from '@kinvolk/headlamp-plugin/lib/lib/k8s';
import { Box, Icon, IconButton } from '@mui/material';
import Alert from '@mui/material/Alert';
import { useEffect, useState } from 'react';
import { getConfigStore, getPrometheusInterval, getPrometheusEndpoint, PrometheusEndpoint } from '../../../util';
import { PrometheusNotFoundBanner } from '../common';
import { DiskChart } from '../DiskChart/DiskChart';

/**
 * Props for the DiskMetricsChart component
 * @interface DiskMetricsChartProps
 * @property {string} [usageQuery] - The Prometheus query to fetch disk usage metrics
 * @property {string} [capacityQuery] - The Prometheus query to fetch disk capacity metrics
 */
interface DiskMetricsChartProps {
  usageQuery?: string;
  capacityQuery?: string;
}

export function DiskMetricsChart(props: DiskMetricsChartProps) {
  enum prometheusState {
    UNKNOWN,
    LOADING,
    ERROR,
    INSTALLED,
  }

  const cluster = useCluster();
  const configStore = getConfigStore();
  const clusterConfig = configStore.useConfig();

  const [refresh, setRefresh] = useState<boolean>(true);
  const [prometheusEndpoint, setPrometheusEndpoint] = useState<PrometheusEndpoint | null>(null);
  const [state, setState] = useState<prometheusState>(prometheusState.LOADING);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const isEnabled = clusterConfig?.clusters?.[cluster]?.enableMetrics || false;
    setIsVisible(isEnabled);
    console.log('cluster', cluster);
    console.log('isEnabled', isEnabled);
    console.log('clusterConfig', clusterConfig);

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
        console.error('Error checking Prometheus installation:', e);
        setState(prometheusState.ERROR);
      }
    })();
  }, [clusterConfig, cluster]);

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
        style={{ marginBottom: '0.5rem', margin: '0 auto', width: '0%' }}
      >
        {state === prometheusState.INSTALLED
          ? [
              <Box>Disk</Box>,
              <Box pl={2}>
                <IconButton
                  onClick={() => {
                    setRefresh(refresh => !refresh);
                  }}
                  size="Big"
                >
                  {refresh ? <Icon icon="mdi:pause" /> : <Icon icon="mdi:play" />}
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
          <DiskChart
            usageQuery={props.usageQuery}
            capacityQuery={props.capacityQuery}
            interval={interval}
            autoRefresh={refresh}
            prometheusEndpoint={prometheusEndpoint}
          />
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
    </SectionBox>
  );
}
