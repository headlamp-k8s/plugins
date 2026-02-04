import { Icon } from '@iconify/react';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
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
  PrometheusResponse,
} from '../../../util';
import { PrometheusNotFoundBanner } from '../common';
import { KedaActiveJobsChart } from '../KedaActiveJobsChart/KedaActiveJobsChart';
import { KedaHPAReplicasChart } from '../KedaHPAReplicasChart/KedaHPAReplicasChart';
import { KedaScalerMetricsChart } from '../KedaScalerMetricsChart/KedaScalerMetricsChart';

/**
 * Props for the KedaChart component
 * @interface KedaChartProps
 * @property {string} kind - The kind of KEDA resource (could be either a 'ScaledObject' or a 'ScaledJob')
 * @property {string} namespace - The namespace of KEDA resource
 * @property {string} name - The name of KEDA resource
 * @property {string} scalerMetricsQuery - The Prometheus query to fetch KEDA Scaler Metrics Value
 * @property {string} hpaReplicasQuery - The Prometheus query to fetch HPA Replicas Count
 * @property {string} activeJobsQuery - The Prometheus query to fetch Active Jobs Count
 * @property {number} minReplicaCount - Minimum Replica Count as specified in the YAML Spec of KEDA Resource
 * @property {number} maxReplicaCount - Maximum Replica Count as specified in the YAML Spec of KEDA Resource
 */
export interface KedaChartProps {
  scalerMetricsQuery: string;
  hpaReplicasQuery?: string;
  activeJobsQuery?: string;
  minReplicaCount: number;
  maxReplicaCount: number;
}

export interface BaseSeriesInfo {
  index: number;
  instance: string;
  startTime: Date;
  endTime: Date;
}

export function extractSeriesInfo<T extends BaseSeriesInfo>(
  response: PrometheusResponse,
  metricExtractor: (metric: any) => Omit<T, keyof BaseSeriesInfo>
): T[] {
  const results = response?.data?.result || [];

  return results.map((result, index) => {
    const resultMetric = result.metric || {};
    const instance = resultMetric.instance || 'Unknown Instance';

    let startTime: Date;
    let endTime: Date;
    const resultValues = result.values || [];
    if (resultValues.length !== 0 && Array.isArray(resultValues[0])) {
      startTime = new Date(Number(resultValues[0][0]) * 1000);
      endTime = new Date(Number(resultValues[resultValues.length - 1][0]) * 1000);
    }

    const customFields = metricExtractor(resultMetric);

    return {
      index,
      instance,
      startTime,
      endTime,
      ...customFields,
    } as T;
  });
}

export interface InstanceGroup<T extends BaseSeriesInfo> {
  instance: string;
  series: T[];
}

export function groupSeriesByInstance<T extends BaseSeriesInfo>(
  seriesInfo: T[]
): InstanceGroup<T>[] {
  const instanceMap = new Map<string, T[]>();

  seriesInfo.forEach(series => {
    if (!instanceMap.has(series.instance)) {
      instanceMap.set(series.instance, []);
    }
    instanceMap.get(series.instance)!.push(series);
  });

  return Array.from(instanceMap.entries()).map(([instance, series]) => ({
    instance,
    series,
  }));
}

export function KedaChart(props: KedaChartProps) {
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
              {refresh ? t('Pause') : t('Resume')}
            </Button>
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
            sx={{
              height: '600px',
              display: 'flex',
              gap: 2,
              p: 1,
            }}
          >
            <KedaScalerMetricsChart
              autoRefresh={refresh}
              prometheusPrefix={prometheusPrefix}
              interval={timespan}
              resolution={resolution}
              subPath={subPath}
              {...props}
            />
            {props.hpaReplicasQuery && (
              <KedaHPAReplicasChart
                autoRefresh={refresh}
                prometheusPrefix={prometheusPrefix}
                interval={timespan}
                resolution={resolution}
                subPath={subPath}
                {...props}
              />
            )}
            {props.activeJobsQuery && (
              <KedaActiveJobsChart
                autoRefresh={refresh}
                prometheusPrefix={prometheusPrefix}
                interval={timespan}
                resolution={resolution}
                subPath={subPath}
                {...props}
              />
            )}
          </Box>
        ) : state === prometheusState.LOADING ? (
          <Box m={2}>
            <Loader title={t('Loading Prometheus Info')} />
          </Box>
        ) : state === prometheusState.ERROR ? (
          <Box m={2}>
            <Alert severity="warning">{t('Error fetching Prometheus Info')}</Alert>
          </Box>
        ) : (
          <PrometheusNotFoundBanner />
        )}
      </Paper>
    </SectionBox>
  );
}
