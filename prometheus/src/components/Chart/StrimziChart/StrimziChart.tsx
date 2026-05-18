import { Icon } from '@iconify/react';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Loader, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useCluster } from '@kinvolk/headlamp-plugin/lib/k8s';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { blue, green, orange, purple, red } from '@mui/material/colors';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import { alpha, useTheme } from '@mui/material/styles';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useEffect, useState } from 'react';
import { fetchMetrics } from '../../../request';
import {
  createTickTimestampFormatter,
  dataProcessor,
  formatBytes,
  getConfigStore,
  getPrometheusInterval,
  getPrometheusPrefix,
  getPrometheusResolution,
  getPrometheusSubPath,
} from '../../../util';
import Chart from '../Chart/Chart';
import { CustomTooltip, CustomTooltipFormatBytes, PrometheusNotFoundBanner } from '../common';
import { CustomToggleButton } from '../GenericMetricsChart/GenericMetricsChart';

/**
 * One line on a Strimzi metrics chart, backed by a single PromQL query.
 */
interface KafkaChartPlot {
  query: string;
  name: string;
  strokeColor: string;
  fillColor: string;
}

/**
 * A selectable metric view on the Kafka detail page (one toggle button).
 */
export interface KafkaChartConfig {
  key: string;
  label: string;
  icon: string;
  plots: KafkaChartPlot[];
  /** Format the Y axis as a byte rate rather than a plain count. */
  bytes?: boolean;
}

interface StrimziChartProps {
  chartConfigs: KafkaChartConfig[];
  defaultChart?: string;
}

/**
 * Builds the metric views shown for a Strimzi `Kafka` cluster.
 *
 * Queries are scoped by namespace only. A Strimzi deployment normally runs a
 * single Kafka cluster per namespace, and namespace scoping keeps the queries
 * working whether or not the `strimzi_io_cluster` label made it through the
 * Prometheus relabeling. They target the kafka-exporter and JMX exporter
 * scrape outputs that ship with the standard Strimzi monitoring stack.
 *
 * @param namespace - Namespace of the Kafka cluster being viewed.
 */
export function getKafkaChartConfigs(namespace: string): KafkaChartConfig[] {
  const ns = `namespace="${namespace}"`;

  return [
    {
      key: 'throughput',
      label: 'Throughput',
      icon: 'mdi:swap-vertical-bold',
      bytes: true,
      plots: [
        {
          query: `sum(rate(kafka_server_brokertopicmetrics_bytesinpersec_count{${ns}}[5m]))`,
          name: 'Bytes in / sec',
          strokeColor: alpha(blue[600], 0.8),
          fillColor: alpha(blue[400], 0.1),
        },
        {
          query: `sum(rate(kafka_server_brokertopicmetrics_bytesoutpersec_count{${ns}}[5m]))`,
          name: 'Bytes out / sec',
          strokeColor: alpha(green[600], 0.8),
          fillColor: alpha(green[400], 0.1),
        },
      ],
    },
    {
      key: 'messages',
      label: 'Messages',
      icon: 'mdi:email-fast-outline',
      plots: [
        {
          query: `sum(rate(kafka_server_brokertopicmetrics_messagesinpersec_count{${ns}}[5m]))`,
          name: 'Messages in / sec',
          strokeColor: alpha(purple[600], 0.8),
          fillColor: alpha(purple[400], 0.1),
        },
      ],
    },
    {
      key: 'partitions',
      label: 'Partition health',
      icon: 'mdi:alert-circle-outline',
      plots: [
        {
          query: `sum(kafka_topic_partition_under_replicated_partition{${ns}})`,
          name: 'Under-replicated partitions',
          strokeColor: alpha(orange[700], 0.8),
          fillColor: alpha(orange[400], 0.1),
        },
        {
          query: `sum(kafka_controller_kafkacontroller_offlinepartitionscount{${ns}}) or vector(0)`,
          name: 'Offline partitions',
          strokeColor: alpha(red[600], 0.8),
          fillColor: alpha(red[400], 0.1),
        },
      ],
    },
    {
      key: 'lag',
      label: 'Consumer lag',
      icon: 'mdi:timer-sand',
      plots: [
        {
          query: `sum(kafka_consumergroup_lag{${ns}})`,
          name: 'Consumer group lag',
          strokeColor: alpha(blue[700], 0.8),
          fillColor: alpha(blue[400], 0.1),
        },
      ],
    },
  ];
}

/**
 * Prometheus metrics for a Strimzi `Kafka` cluster, shown as a section on the
 * Kafka detail page. Mirrors the Karpenter/KEDA charts: it reuses the
 * Prometheus plugin's cluster config, endpoint discovery, and `Chart`
 * component, so manual-address and autoDetect setups both work.
 */
export function StrimziChart(props: StrimziChartProps) {
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
  const theme = useTheme();

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
  const [selectedChart, setSelectedChart] = useState<string>(
    props.defaultChart || props.chartConfigs[0]?.key || ''
  );

  if (!isVisible || props.chartConfigs.length === 0) {
    return null;
  }

  const handleChartVariantChange = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSelectedChart(event.currentTarget.value);
  };

  const currentChartConfig =
    props.chartConfigs.find(config => config.key === selectedChart) ?? props.chartConfigs[0];

  const xTickFormatter = createTickTimestampFormatter(timespan);
  const xAxisProps = {
    dataKey: 'timestamp',
    tickLine: false,
    tick: (tickProps: any) => {
      const value = xTickFormatter(tickProps.payload.value);
      if (!value) return null;

      return (
        <g
          transform={`translate(${tickProps.x},${tickProps.y})`}
          fill={theme.palette.chartStyles.labelColor}
        >
          <text x={0} y={10} dy={0} textAnchor="middle">
            {value}
          </text>
        </g>
      );
    },
  };

  const yAxisProps = currentChartConfig.bytes
    ? { domain: [0, 'auto'], width: 80, tickFormatter: (value: number) => formatBytes(value) }
    : { domain: [0, 'auto'], width: 60, allowDecimals: false };

  return (
    <SectionBox>
      <Paper variant="outlined" sx={{ p: 1 }}>
        {state === prometheusState.INSTALLED && (
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
                      label={config.label}
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
            </Box>

            <Box
              sx={{
                height: '400px',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                p: 2,
              }}
            >
              <Chart
                plots={currentChartConfig.plots.map(plot => ({
                  query: plot.query,
                  name: plot.name,
                  strokeColor: plot.strokeColor,
                  fillColor: plot.fillColor,
                  dataProcessor: dataProcessor,
                }))}
                xAxisProps={xAxisProps}
                yAxisProps={yAxisProps}
                CustomTooltip={currentChartConfig.bytes ? CustomTooltipFormatBytes : CustomTooltip}
                fetchMetrics={fetchMetrics}
                autoRefresh={refresh}
                prometheusPrefix={prometheusPrefix}
                interval={timespan}
                resolution={resolution}
                subPath={subPath}
              />
            </Box>
          </>
        )}

        {state === prometheusState.LOADING ? (
          <Box m={2}>
            <Loader title={t('Loading Prometheus Info')} />
          </Box>
        ) : state === prometheusState.ERROR ? (
          <Box m={2}>
            <Alert severity="warning">{t('Error fetching Prometheus Info')}</Alert>
          </Box>
        ) : state === prometheusState.UNKNOWN ? (
          <PrometheusNotFoundBanner />
        ) : null}
      </Paper>
    </SectionBox>
  );
}
