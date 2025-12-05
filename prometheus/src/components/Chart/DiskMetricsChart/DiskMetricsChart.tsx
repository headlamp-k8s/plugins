import { Icon } from '@iconify/react';
import { Loader, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useCluster } from '@kinvolk/headlamp-plugin/lib/lib/k8s';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { useEffect, useState } from 'react';
import {
  getConfigStore,
  getPrometheusInterval,
  getPrometheusPrefix,
  getPrometheusResolution,
  getPrometheusSubPath,
} from '../../../util';
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
  const useClusterConfig = configStore.useConfig();
  const clusterConfig = useClusterConfig();

  const [refresh, setRefresh] = useState<boolean>(true);
  const [prometheusPrefix, setPrometheusPrefix] = useState<string | null>(null);
  const [state, setState] = useState<prometheusState>(prometheusState.LOADING);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const isEnabled = cluster ? clusterConfig?.[cluster]?.isMetricsEnabled ?? false : false;
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

  if (!isVisible) {
    return null;
  }

  const interval = getPrometheusInterval(cluster);
  const resolution = getPrometheusResolution(cluster);
  const subPath = getPrometheusSubPath(cluster);
  return (
    <SectionBox>
      <Box
        display="flex"
        justifyContent="space-around"
        alignItems="center"
        style={{ marginBottom: '0.5rem', margin: '0 auto', width: '0%' }}
      >
        {state === prometheusState.INSTALLED && (
          <>
            <Box>Disk</Box>
            <Box pl={2}>
              <IconButton
                onClick={() => {
                  setRefresh(prev => !prev);
                }}
                size="large"
              >
                {refresh ? (
                  <Icon icon="mdi:pause" width="20px" height="20px" />
                ) : (
                  <Icon icon="mdi:play" width="20px" height="20px" />
                )}
              </IconButton>
            </Box>
          </>
        )}
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
            resolution={resolution}
            autoRefresh={refresh}
            prometheusPrefix={prometheusPrefix}
            subPath={subPath}
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
