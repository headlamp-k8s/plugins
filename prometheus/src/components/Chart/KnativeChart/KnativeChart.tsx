/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
import { useEffect, useMemo, useState } from 'react';
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
import { KnativeLatencyChart } from '../KnativeLatencyChart/KnativeLatencyChart';
import { KnativePodResourceChart } from '../KnativePodResourceChart/KnativePodResourceChart';
import { KnativeRequestRateChart } from '../KnativeRequestRateChart/KnativeRequestRateChart';
import { KnativeRevisionBreakdownChart } from '../KnativeRevisionBreakdownChart/KnativeRevisionBreakdownChart';

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
  component: React.ComponentType<any>;
}

export function KnativeChart({
  namespace,
  serviceName,
  revisionName,
}: {
  namespace: string;
  serviceName: string;
  revisionName?: string;
}) {
  const { t } = useTranslation();
  const cluster = useCluster() || '';
  const configStore = useMemo(() => getConfigStore(), []);
  const clusterConfig = configStore.useConfig();
  const theme = useTheme();

  // Build chart configs: include "By Revision" only on KService view (no revisionName)
  const chartConfigs: ChartConfig[] = useMemo(() => {
    const configs: ChartConfig[] = [
      {
        key: 'request-rate',
        label: t('Request Rate'),
        icon: 'mdi:chart-line',
        component: KnativeRequestRateChart,
      },
      {
        key: 'latency',
        label: t('Latency'),
        icon: 'mdi:timer-outline',
        component: KnativeLatencyChart,
      },
      {
        key: 'resources',
        label: t('Resources'),
        icon: 'mdi:chip',
        component: KnativePodResourceChart,
      },
    ];

    // Only show "By Revision" on KService detail, not on individual Revision detail
    if (!revisionName) {
      configs.splice(1, 0, {
        key: 'by-revision',
        label: t('By Revision'),
        icon: 'mdi:source-branch',
        component: KnativeRevisionBreakdownChart,
      });
    }

    return configs;
  }, [revisionName]);

  const [refresh, setRefresh] = useState<boolean>(true);
  const [prometheusPrefix, setPrometheusPrefix] = useState<string | null>(null);
  const [state, setState] = useState<PrometheusState>(PrometheusState.LOADING);
  const [isVisible, setIsVisible] = useState<boolean>(false);

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
  const [selectedChart, setSelectedChart] = useState<string>(chartConfigs[0].key);

  useEffect(() => {
    if (!chartConfigs.some(config => config.key === selectedChart)) {
      setSelectedChart(chartConfigs[0].key);
    }
  }, [chartConfigs, selectedChart]);

  if (!isVisible) {
    return null;
  }

  const handleChartVariantChange = (
    event: React.MouseEvent<HTMLElement>,
    newChart: string | null
  ) => {
    if (newChart !== null) {
      setSelectedChart(newChart);
    }
  };

  const CustomTooltip = (props: any) => {
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
          <p>
            {t('Time: {{ time }}', {
              time: formatter(label) || new Date(label * 1000).toLocaleTimeString(),
            })}
          </p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color }}>
              {`${p.name}: ${
                typeof p.value === 'number'
                  ? p.value > 1000000
                    ? (p.value / 1000000).toFixed(2) + ' MB'
                    : p.value.toFixed(2)
                  : p.value
              }`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const currentChartConfig = chartConfigs.find(config => config.key === selectedChart);

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
                  aria-label="metric chooser"
                  value={selectedChart}
                  exclusive
                >
                  {chartConfigs.map(config => (
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
              {currentChartConfig && (
                <currentChartConfig.component
                  refresh={refresh}
                  prometheusPrefix={prometheusPrefix!}
                  resolution={resolution}
                  subPath={subPath}
                  timespan={timespan}
                  namespace={namespace}
                  serviceName={serviceName}
                  revisionName={revisionName}
                  CustomTooltip={CustomTooltip}
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
