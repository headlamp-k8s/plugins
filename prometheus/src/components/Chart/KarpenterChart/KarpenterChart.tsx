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
  getConfigStore,
  getPrometheusInterval,
  getPrometheusPrefix,
  getPrometheusResolution,
  getPrometheusSubPath,
} from '../../../util';
import { createTickTimestampFormatter } from '../../../util';
import { PrometheusNotFoundBanner } from '../common';
import { CustomToggleButton } from '../GenericMetricsChart/GenericMetricsChart';

interface ChartConfig {
  key: string;
  label: string;
  icon: string;
  queries: Record<string, string>;
  component: React.ComponentType<any>;
}

interface KarpenterChartProps {
  chartConfigs: ChartConfig[];
  defaultChart?: string;
}

export function KarpenterChart(props: KarpenterChartProps) {
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

  const NodePoolTooltip = props => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      const formatter = createTickTimestampFormatter(timespan);
      return (
        <div
          style={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            padding: theme.spacing(1),
            borderRadius: theme.shape.borderRadius,
          }}
        >
          <p>{t('Time: {{ time }}', { time: formatter(label) })}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }}>
              {`${p.name}: ${p.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const currentChartConfig = props.chartConfigs.find(config => config.key === selectedChart);

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
                  aria-label="metric chooser"
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
                  NodePoolTooltip={NodePoolTooltip}
                  {...currentChartConfig.queries}
                />
              )}
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
