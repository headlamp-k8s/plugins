import { Icon } from '@iconify/react';
import { K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Loader, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Alert,
  Box,
  IconButton,
  MenuItem,
  Select,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { blue, green, red } from '@mui/material/colors';
import { alpha, useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { createTickTimestampFormatter, getConfigStore, getPrometheusPrefix } from '../../../util';
import {
  getTinkerbellQueries,
  TinkerbellController,
} from '../../Config/tinkerbellChart/tinkerbellQueries';
import Chart from '../Chart/Chart';
import { PrometheusNotFoundBanner } from '../common';
import { CustomToggleButton } from '../GenericMetricsChart/GenericMetricsChart';
import { fetchTinkerbellMetrics, processTinkerbellMetrics } from './metrics';

/** Props for controller-wide Tinkerbell metrics on resource detail pages. */
interface TinkerbellChartProps {
  /** Controller associated with the resource's API group and kind. */
  controller: TinkerbellController;
}

/**
 * Uses the shared Prometheus settings and resets charts when the source changes.
 * @param props - Controller identity, deliberately excluding resource names.
 * @returns Controller health section, or nothing when metrics are disabled.
 */
export function TinkerbellChart(props: TinkerbellChartProps) {
  const cluster = K8s.useCluster();
  const useConfig = getConfigStore().useConfig();
  const config = useConfig()?.[cluster];
  if (!config?.isMetricsEnabled) {
    return null;
  }
  return (
    <ControllerCharts
      key={JSON.stringify([cluster, props.controller, config])}
      controller={props.controller}
      cluster={cluster}
      job={config.tinkerbellJob ?? 'tinkerbell'}
      subPath={config.subPath ?? ''}
      defaultTimespan={config.defaultTimespan ?? '24h'}
      defaultResolution={config.defaultResolution ?? 'medium'}
    />
  );
}

/** Connection and display settings for a single mounted chart session. */
interface ControllerChartsProps extends TinkerbellChartProps {
  /** Headlamp cluster whose Prometheus configuration is used. */
  cluster: string;
  /** Exact scrape job identifying the Tinkerbell installation. */
  job: string;
  /** Optional Prometheus HTTP path prefix. */
  subPath: string;
  /** Initial historical time range. */
  defaultTimespan: string;
  /** Initial query step size or automatic resolution. */
  defaultResolution: string;
}

/**
 * Displays controller rates, durations, queue depth, and worker activity.
 * @param props - Controller, scrape source, and initial display settings.
 * @returns Shared Headlamp chart controls and loading, error, or data content.
 */
function ControllerCharts(props: ControllerChartsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [source, setSource] = useState<{
    prefix?: string;
    state: 'loading' | 'error' | 'missing' | 'ready';
  }>({ state: 'loading' });
  const [selected, setSelected] = useState('reconcile');
  const [refresh, setRefresh] = useState(true);
  const [timespan, setTimespan] = useState(props.defaultTimespan);
  const [resolution, setResolution] = useState(props.defaultResolution);

  useEffect(() => {
    let cancelled = false;
    getPrometheusPrefix(props.cluster).then(
      prefix => {
        if (!cancelled) setSource(prefix ? { state: 'ready', prefix } : { state: 'missing' });
      },
      () => {
        if (!cancelled) setSource({ state: 'error' });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [props.cluster]);

  const titles = {
    workflow: t('Workflow Controller Health'),
    machine: t('BMC Machine Controller Health'),
    job: t('BMC Job Controller Health'),
    task: t('BMC Task Controller Health'),
  };
  const queries = getTinkerbellQueries(props.controller, props.job);
  const charts = [
    {
      key: 'reconcile',
      label: t('Reconciliations'),
      icon: 'mdi:sync',
      unit: t('operations/s'),
      integer: false,
      plots: [
        { query: queries.reconciliations, name: t('All reconciliations'), color: blue[600] },
        { query: queries.errors, name: t('Errors'), color: red[600] },
      ],
    },
    {
      key: 'duration',
      label: t('Duration'),
      icon: 'mdi:timer-outline',
      unit: t('seconds'),
      integer: false,
      plots: [
        { query: queries.durationP50, name: t('p50'), color: blue[600] },
        { query: queries.durationP95, name: t('p95'), color: green[600] },
      ],
    },
    {
      key: 'queue',
      label: t('Queue'),
      icon: 'mdi:format-list-numbered',
      unit: t('items'),
      integer: true,
      plots: [{ query: queries.queue, name: t('Queued reconciliations'), color: blue[600] }],
    },
    {
      key: 'workers',
      label: t('Workers'),
      icon: 'mdi:cog-outline',
      unit: t('workers'),
      integer: true,
      plots: [
        { query: queries.activeWorkers, name: t('Active workers'), color: blue[600] },
        { query: queries.maxWorkers, name: t('Worker capacity'), color: green[600] },
      ],
    },
  ];
  const chart = charts.find(chart => chart.key === selected) ?? charts[0];

  return (
    <SectionBox title={titles[props.controller]}>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {t(
          'Controller-wide metrics for scrape job "{{ job }}", not individual provisioning results.',
          { job: props.job }
        )}
      </Typography>
      {!props.job.trim() ? (
        <Alert severity="info">
          {t('Tinkerbell Scrape Job is not configured in Prometheus settings.')}
        </Alert>
      ) : source.state === 'loading' ? (
        <Loader title={t('Loading Prometheus Info')} />
      ) : source.state === 'error' ? (
        <Alert severity="warning">{t('Error fetching Prometheus Info')}</Alert>
      ) : source.state === 'missing' ? (
        <PrometheusNotFoundBanner />
      ) : (
        <>
          <Box display="flex" flexWrap="wrap" gap={1} justifyContent="space-between" mb={2}>
            <ToggleButtonGroup
              value={selected}
              exclusive
              size="small"
              aria-label={t('metric chooser')}
              onChange={(_, value) => {
                if (value) setSelected(value);
              }}
              sx={{ flexWrap: 'wrap' }}
            >
              {charts.map(chart => (
                <CustomToggleButton
                  key={chart.key}
                  value={chart.key}
                  label={chart.label}
                  icon={chart.icon}
                />
              ))}
            </ToggleButtonGroup>
            <Box display="flex" flexWrap="wrap" gap={1}>
              <Tooltip title={refresh ? t('Pause') : t('Resume')}>
                <IconButton
                  aria-label={refresh ? t('Pause') : t('Resume')}
                  onClick={() => setRefresh(value => !value)}
                >
                  <Icon icon={refresh ? 'mdi:pause' : 'mdi:play'} />
                </IconButton>
              </Tooltip>
              <Select
                size="small"
                inputProps={{ 'aria-label': t('Timespan') }}
                value={timespan}
                onChange={e => setTimespan(e.target.value)}
              >
                {[
                  '10m',
                  '30m',
                  '1h',
                  '3h',
                  '6h',
                  '12h',
                  '24h',
                  '48h',
                  'today',
                  'yesterday',
                  'week',
                  'lastweek',
                  '7d',
                  '14d',
                ].map(value => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
              <Select
                size="small"
                inputProps={{ 'aria-label': t('Resolution') }}
                value={resolution}
                onChange={e => setResolution(e.target.value)}
              >
                <MenuItem value="low">{t('Low res.')}</MenuItem>
                <MenuItem value="medium">{t('Medium res.')}</MenuItem>
                <MenuItem value="high">{t('High res.')}</MenuItem>
                {['10s', '30s', '1m', '5m', '15m', '1h'].map(value => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {chart.unit}
          </Typography>
          <Box height={360} minWidth={0}>
            <Chart
              key={JSON.stringify([selected, timespan, resolution])}
              plots={chart.plots.map(plot => ({
                ...plot,
                strokeColor: plot.color,
                fillColor: alpha(plot.color, 0.08),
                dataProcessor: processTinkerbellMetrics,
                stackId: null,
              }))}
              fetchMetrics={fetchTinkerbellMetrics}
              prometheusPrefix={source.prefix!}
              subPath={props.subPath}
              interval={timespan}
              resolution={resolution}
              autoRefresh={refresh}
              xAxisProps={{
                dataKey: 'timestamp',
                tickFormatter: createTickTimestampFormatter(timespan),
                stroke: theme.palette.text.secondary,
              }}
              yAxisProps={{ domain: [0, 'auto'], allowDecimals: !chart.integer }}
              CustomTooltip={({ active, payload, label }) =>
                active && payload?.length ? (
                  <Box
                    sx={{ p: 1, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}
                  >
                    <Typography variant="caption">
                      {new Date(Number(label) * 1000).toLocaleString()}
                    </Typography>
                    {payload.map(point => (
                      <Typography key={point.name} variant="body2" color={point.color}>
                        {point.name}:{' '}
                        {Number(point.value).toLocaleString(undefined, {
                          maximumSignificantDigits: 4,
                        })}{' '}
                        {chart.unit}
                      </Typography>
                    ))}
                  </Box>
                ) : null
              }
            />
          </Box>
        </>
      )}
    </SectionBox>
  );
}
