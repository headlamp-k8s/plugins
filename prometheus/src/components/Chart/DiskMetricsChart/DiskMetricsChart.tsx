 import { Icon } from '@iconify/react';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Loader, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useCluster } from '@kinvolk/headlamp-plugin/lib/lib/k8s';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
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
  const { t } = useTranslation();

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

  // Default values come from the global plugin setting, but can be
  // overridden per-view using the dropdowns below.
  const defaultInterval = getPrometheusInterval(cluster);
  const defaultResolution = getPrometheusResolution(cluster);
  const subPath = getPrometheusSubPath(cluster);

  const [timespan, setTimespan] = useState(defaultInterval ?? '1h');
  const [resolution, setResolution] = useState(defaultResolution ?? 'medium');

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

  return (
    <SectionBox>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        style={{ marginBottom: '0.5rem' }}
      >
        {state === prometheusState.INSTALLED && (
          <>
            <Box display="flex" alignItems="center">
              <Box>{t('Disk')}</Box>
              <Box pl={2}>
                <IconButton
                  aria-label={refresh ? t('Pause') : t('Resume')}
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
            </Box>
            <Box display="flex" gap={1}>
              <Select
                inputProps={{ 'aria-label': t('Timespan') }}
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
              <Select
                inputProps={{ 'aria-label': t('Resolution') }}
                variant="outlined"
                size="small"
                name="Resolution"
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
            interval={timespan}
            resolution={resolution}
            autoRefresh={refresh}
            prometheusPrefix={prometheusPrefix}
            subPath={subPath}
          />
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
    </SectionBox>
  );
}
