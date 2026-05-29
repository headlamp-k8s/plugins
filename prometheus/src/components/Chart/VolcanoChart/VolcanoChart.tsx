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
import { useTheme } from '@mui/material/styles';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useEffect, useState } from 'react';
import {
  createTickTimestampFormatter,
  getConfigStore,
  getPrometheusInterval,
  getPrometheusPrefix,
  getPrometheusResolution,
  getPrometheusSubPath,
} from '../../../util';
import { PrometheusNotFoundBanner } from '../common';
import { CustomToggleButton } from '../GenericMetricsChart/GenericMetricsChart';
import { VolcanoQueueCPUChart } from '../VolcanoQueueCPUChart/VolcanoQueueCPUChart';
import { VolcanoQueueMemoryChart } from '../VolcanoQueueMemoryChart/VolcanoQueueMemoryChart';
import { VolcanoQueuePodGroupsChart } from '../VolcanoQueuePodGroupsChart/VolcanoQueuePodGroupsChart';

enum PrometheusState {
  UNKNOWN,
  LOADING,
  ERROR,
  INSTALLED,
}

interface ChartConfig {
  key: string;
  label: string;
  icon: string;
  queries: Record<string, string>;
  component: React.ComponentType<any>;
}

interface VolcanoChartProps {
  chartConfigs: ChartConfig[];
  defaultChart?: string;
}

function escapePrometheusLabelValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function getVolcanoQueueMetricQuery(metricName: string, queueName: string) {
  return `${metricName}{queue_name="${queueName}"}`;
}

export function getVolcanoQueueChartConfigs(queueName: string): ChartConfig[] {
  const queueLabel = escapePrometheusLabelValue(queueName);

  return [
    {
      key: 'cpu',
      label: 'CPU',
      icon: 'mdi:chip',
      queries: {
        allocatedQuery: getVolcanoQueueMetricQuery('volcano_queue_allocated_milli_cpu', queueLabel),
        requestQuery: getVolcanoQueueMetricQuery('volcano_queue_request_milli_cpu', queueLabel),
        deservedQuery: getVolcanoQueueMetricQuery('volcano_queue_deserved_milli_cpu', queueLabel),
        capacityQuery: getVolcanoQueueMetricQuery('volcano_queue_capacity_milli_cpu', queueLabel),
      },
      component: VolcanoQueueCPUChart,
    },
    {
      key: 'memory',
      label: 'Memory',
      icon: 'mdi:memory',
      queries: {
        allocatedQuery: getVolcanoQueueMetricQuery(
          'volcano_queue_allocated_memory_bytes',
          queueLabel
        ),
        requestQuery: getVolcanoQueueMetricQuery('volcano_queue_request_memory_bytes', queueLabel),
        deservedQuery: getVolcanoQueueMetricQuery(
          'volcano_queue_deserved_memory_bytes',
          queueLabel
        ),
        capacityQuery: getVolcanoQueueMetricQuery(
          'volcano_queue_capacity_memory_bytes',
          queueLabel
        ),
      },
      component: VolcanoQueueMemoryChart,
    },
    {
      key: 'podgroups',
      label: 'PodGroups',
      icon: 'mdi:account-group',
      queries: {
        inqueueQuery: getVolcanoQueueMetricQuery(
          'volcano_queue_pod_group_inqueue_count',
          queueLabel
        ),
        pendingQuery: getVolcanoQueueMetricQuery(
          'volcano_queue_pod_group_pending_count',
          queueLabel
        ),
        runningQuery: getVolcanoQueueMetricQuery(
          'volcano_queue_pod_group_running_count',
          queueLabel
        ),
        completedQuery: getVolcanoQueueMetricQuery(
          'volcano_queue_pod_group_completed_count',
          queueLabel
        ),
        unknownQuery: getVolcanoQueueMetricQuery(
          'volcano_queue_pod_group_unknown_count',
          queueLabel
        ),
      },
      component: VolcanoQueuePodGroupsChart,
    },
  ];
}

export function VolcanoChart(props: VolcanoChartProps) {
  const { t } = useTranslation();
  const cluster = useCluster();
  const configStore = getConfigStore();
  const useClusterConfig = configStore.useConfig();
  const clusterConfig = useClusterConfig();
  const theme = useTheme();

  const [refresh, setRefresh] = useState<boolean>(true);
  const [prometheusPrefix, setPrometheusPrefix] = useState<string | null>(null);
  const [state, setState] = useState<PrometheusState>(PrometheusState.LOADING);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [selectedChart, setSelectedChart] = useState<string>(
    props.defaultChart || props.chartConfigs[0]?.key || ''
  );

  useEffect(() => {
    const isEnabled = clusterConfig?.[cluster]?.isMetricsEnabled || false;
    setIsVisible(isEnabled);

    if (!isEnabled) {
      setState(PrometheusState.UNKNOWN);
      setPrometheusPrefix(null);
      return;
    }

    setState(PrometheusState.LOADING);
    (async () => {
      try {
        const prefix = await getPrometheusPrefix(cluster);
        if (prefix) {
          setPrometheusPrefix(prefix);
          setState(PrometheusState.INSTALLED);
        } else {
          setState(PrometheusState.UNKNOWN);
        }
      } catch (e) {
        console.error('Error checking Prometheus installation:', e);
        setState(PrometheusState.ERROR);
      }
    })();
  }, [clusterConfig, cluster]);

  const interval = getPrometheusInterval(cluster);
  const graphResolution = getPrometheusResolution(cluster);
  const subPath = getPrometheusSubPath(cluster);

  const [timespan, setTimespan] = useState(interval ?? '1h');
  const [resolution, setResolution] = useState(graphResolution ?? 'medium');

  if (!isVisible || props.chartConfigs.length === 0) {
    return null;
  }

  const handleChartVariantChange = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSelectedChart(event.currentTarget.value);
  };

  const CustomTooltip = ({ active, payload, label, valueFormatter }) => {
    if (active && payload && payload.length) {
      const formatter = createTickTimestampFormatter(timespan);
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 1,
          }}
        >
          <p>{t('Time: {{ time }}', { time: formatter(label) })}</p>
          {payload.map((item, index) => (
            <p key={index} style={{ color: item.color }}>
              {`${item.name}: ${valueFormatter ? valueFormatter(item.value) : item.value}`}
            </p>
          ))}
        </Box>
      );
    }
    return null;
  };

  const currentChartConfig = props.chartConfigs.find(config => config.key === selectedChart);

  return (
    <SectionBox>
      <Paper variant="outlined" sx={{ p: 1 }}>
        {state === PrometheusState.INSTALLED && (
          <>
            <Box display="flex" gap={1} justifyContent="space-between" mb={2}>
              <Box display="flex" gap={1}>
                <ToggleButtonGroup
                  onChange={handleChartVariantChange}
                  size="small"
                  aria-label={t('metric chooser')}
                  value={selectedChart}
                  exclusive
                >
                  {props.chartConfigs.map(config => (
                    <CustomToggleButton
                      key={config.key}
                      label={t(config.label)}
                      value={config.key}
                      icon={config.icon}
                    />
                  ))}
                </ToggleButtonGroup>
              </Box>
              <Box display="flex" gap={1}>
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
                <Select
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
            </Box>

            <Box
              sx={{
                height: '400px',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                p: 2,
              }}
            >
              {currentChartConfig && (
                <currentChartConfig.component
                  refresh={refresh}
                  prometheusPrefix={prometheusPrefix}
                  resolution={resolution}
                  subPath={subPath}
                  timespan={timespan}
                  CustomTooltip={CustomTooltip}
                  {...currentChartConfig.queries}
                />
              )}
            </Box>
          </>
        )}

        {state === PrometheusState.LOADING ? (
          <Box m={2}>
            <Loader title={t('Loading Prometheus Info')} />
          </Box>
        ) : state === PrometheusState.ERROR ? (
          <Box m={2}>
            <Alert severity="warning">{t('Error fetching Prometheus Info')}</Alert>
          </Box>
        ) : state === PrometheusState.UNKNOWN ? (
          <PrometheusNotFoundBanner />
        ) : null}
      </Paper>
    </SectionBox>
  );
}
