import { Icon } from '@iconify/react';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useCluster } from '@kinvolk/headlamp-plugin/lib/k8s';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useEffect, useState } from 'react';
import {
  getConfigStore,
  getPrometheusInterval,
  getPrometheusPrefix,
  getPrometheusResolution,
  getPrometheusSubPath,
} from '../../../util';
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
  const { t } = useTranslation();

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
              {refresh ? t('Pause') : t('Resume')}
            </Button>
            <ToggleButtonGroup
              onChange={handleChartVariantChange}
              size="small"
              aria-label="metric chooser"
              value={chartVariant}
              exclusive
            >
              <CustomToggleButton label={t('CPU')} value="cpu" icon="mdi:chip" />
              <CustomToggleButton label={t('Memory')} value="memory" icon="mdi:memory" />
              <CustomToggleButton
                label={t('Network')}
                value="network"
                icon="mdi:folder-network-outline"
              />
              <CustomToggleButton label={t('Filesystem')} value="filesystem" icon="mdi:database" />
            </ToggleButtonGroup>
            <Box>
              <Select
                variant="outlined"
                size="small"
                name="Time"
                value={timespan}
                onChange={e => setTimespan(e.target.value)}
              >
                <MenuItem value={'10m'}>{t('10 minutes')}</MenuItem>
                <MenuItem value={'30m'}>{t('30 minutes')}</MenuItem>
                <MenuItem value={'1h'}>{t('1 hour')}</MenuItem>
                <MenuItem value={'3h'}>{t('3 hours')}</MenuItem>
                <MenuItem value={'6h'}>{t('6 hours')}</MenuItem>
                <MenuItem value={'12h'}>{t('12 hours')}</MenuItem>
                <MenuItem value={'24h'}>{t('24 hours')}</MenuItem>
                <MenuItem value={'48h'}>{t('48 hours')}</MenuItem>
                <MenuItem value={'today'}>{t('Today')}</MenuItem>
                <MenuItem value={'yesterday'}>{t('Yesterday')}</MenuItem>
                <MenuItem value={'week'}>{t('Week')}</MenuItem>
                <MenuItem value={'lastweek'}>{t('Last week')}</MenuItem>
                <MenuItem value={'7d'}>{t('7 days')}</MenuItem>
                <MenuItem value={'14d'}>{t('14 days')}</MenuItem>
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
                <ListSubheader>{t('Automatic resolution')}</ListSubheader>
                <MenuItem value="low">{t('Low res.')}</MenuItem>
                <MenuItem value="medium">{t('Medium res.')}</MenuItem>
                <MenuItem value="high">{t('High res.')}</MenuItem>

                <ListSubheader>{t('Fixed resolution')}</ListSubheader>
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
            {chartVariant === 'cpu' && (
              <CPUChart
                query={props.cpuQuery}
                autoRefresh={refresh}
                prometheusPrefix={prometheusPrefix}
                interval={timespan}
                resolution={resolution}
                subPath={subPath}
              />
            )}
            {chartVariant === 'memory' && (
              <MemoryChart
                query={props.memoryQuery}
                autoRefresh={refresh}
                prometheusPrefix={prometheusPrefix}
                interval={timespan}
                resolution={resolution}
                subPath={subPath}
              />
            )}
            {chartVariant === 'network' && (
              <NetworkChart
                rxQuery={props.networkRxQuery}
                txQuery={props.networkTxQuery}
                autoRefresh={refresh}
                interval={timespan}
                resolution={resolution}
                prometheusPrefix={prometheusPrefix}
                subPath={subPath}
              />
            )}
            {chartVariant === 'filesystem' && (
              <FilesystemChart
                readQuery={props.filesystemReadQuery}
                writeQuery={props.filesystemWriteQuery}
                autoRefresh={refresh}
                interval={timespan}
                resolution={resolution}
                prometheusPrefix={prometheusPrefix}
                subPath={subPath}
              />
            )}
          </Box>
        ) : state === prometheusState.LOADING ? (
          <Box m={2}>
            <Loader title={t('Loading Prometheus Info')} />
          </Box>
        ) : state === prometheusState.ERROR ? (
          <Box m={2}>
            <Alert severity="warning">{t('Error fetching prometheus Info')}</Alert>
          </Box>
        ) : (
          <PrometheusNotFoundBanner />
        )}
      </Paper>
    </SectionBox>
  );
}

export function CustomToggleButton({
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
