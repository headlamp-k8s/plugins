import { Icon } from '@iconify/react';
import { ConfigStore, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import { useTheme } from '@mui/material/styles';
import ToggleButton, { ToggleButtonProps } from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import { useEffect, useId, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  getConfigStore,
  getPrometheusInterval,
  getPrometheusPrefix,
  getPrometheusResolution,
  getPrometheusSubPath,
  PLUGIN_NAME,
} from '../../../util';
import { PrometheusNotFoundBanner } from '../common';
import { CPUChart } from '../CPUChart/CPUChart';
import { FilesystemChart } from '../FilesystemChart/FilesystemChart';
import { MemoryChart } from '../MemoryChart/MemoryChart';
import { NetworkChart } from '../NetworkChart/NetworkChart';
import { useRevisionMarkers } from './useRevisionMarkers';

const warningPreferences = new ConfigStore<Record<string, boolean>>(
  `${PLUGIN_NAME}:revisionWarnings`
);

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
  resource?: KubeObject;
  cpuQuery: string;
  memoryQuery: string;
  networkRxQuery: string;
  networkTxQuery: string;
  filesystemReadQuery: string;
  filesystemWriteQuery: string;
}

export function GenericMetricsChart(props: GenericMetricsChartProps) {
  const { t } = useTranslation(PLUGIN_NAME);
  const theme = useTheme();

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
  const cluster = K8s.useCluster();
  const configStore = getConfigStore();
  const useClusterConfig = configStore.useConfig();
  const clusterConfig = useClusterConfig();
  const useWarningPreferences = warningPreferences.useConfig();
  const minimizedWarnings = useWarningPreferences();
  const warningMinimized = minimizedWarnings?.[cluster] === true;
  const warningId = useId();
  const warningIcon = useRef<HTMLButtonElement>(null);
  const warningDetails = useRef<HTMLDetailsElement>(null);
  const focusWarningControl = useRef(false);
  const setWarningMinimized = (minimized: boolean) => {
    focusWarningControl.current = true;
    warningPreferences.update({ [cluster]: minimized });
  };
  useEffect(() => {
    if (!focusWarningControl.current) return;
    focusWarningControl.current = false;
    if (warningMinimized) warningIcon.current?.focus();
    else warningDetails.current?.querySelector('summary')?.focus();
  }, [warningMinimized]);

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

  const handleChartVariantChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: string | null
  ) => {
    if (value !== null) setChartVariant(value);
  };

  const interval = getPrometheusInterval(cluster);
  const graphResolution = getPrometheusResolution(cluster);
  const subPath = getPrometheusSubPath(cluster);

  const [timespan, setTimespan] = useState(interval ?? '1h');
  const [resolution, setResolution] = useState(graphResolution ?? 'medium');
  const revisionMarkers = useRevisionMarkers(
    props.resource,
    isVisible && state === prometheusState.INSTALLED
  );
  const referenceLines = revisionMarkers.enabled
    ? revisionMarkers.markers.map(marker => ({
        x: marker.timestamp,
        label:
          marker.reuse === 'recorded'
            ? t('r{{ revision }} (reused)', { revision: marker.revision })
            : marker.reuse === 'inferred'
            ? t('r{{ revision }} (possible reuse)', { revision: marker.revision })
            : t('r{{ revision }}', { revision: marker.revision }),
        tooltip: (
          <Box>
            <Box fontWeight="bold">
              {t('Current revision: r{{ revision }}', { revision: marker.revision })}
            </Box>
            {marker.name &&
              (marker.href ? (
                <Link component={RouterLink} to={marker.href} color="inherit" underline="always">
                  {marker.name}
                </Link>
              ) : (
                <Box>{marker.name}</Box>
              ))}
            <Box>
              {t('Created: {{ timestamp }}', {
                timestamp: new Date(marker.timestamp * 1000).toLocaleString(undefined, {
                  timeZoneName: 'short',
                }),
              })}
            </Box>
            {marker.previousRevisions && (
              <Box>
                {t('Previously served revisions (retained): {{ revisions }}', {
                  revisions: marker.previousRevisions.map(revision => `r${revision}`).join(', '),
                })}
              </Box>
            )}
            {marker.reuse === 'recorded' && (
              <Box>{t('This object was reused; the reuse or rollback time is unavailable.')}</Box>
            )}
            {marker.reuse === 'inferred' && (
              <Box>
                {t(
                  'Possible reuse: revision order differs from creation order. Earlier revision numbers and rollback time are unavailable.'
                )}
              </Box>
            )}
          </Box>
        ),
        tooltipFooter: t(
          'Markers show retained revision object creation times, not rollout completion.'
        ),
        stroke: theme.palette.info.main,
        strokeDasharray: '3 3',
      }))
    : undefined;

  if (!isVisible) {
    return null;
  }

  return (
    <SectionBox>
      <Paper variant="outlined" sx={{ p: 1 }}>
        {state === prometheusState.INSTALLED && (
          <Box display="flex" flexWrap="wrap" gap={1} justifyContent="flex-end" mb={2}>
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
            {revisionMarkers.status === 'loading' && (
              <Loader noContainer size={16} title={t('Loading revision markers...')} />
            )}
            {revisionMarkers.enabled && revisionMarkers.status === 'error' && warningMinimized && (
              <Tooltip title={t('Show revision marker warning')}>
                <IconButton
                  ref={warningIcon}
                  color="warning"
                  aria-label={t('Show revision marker warning')}
                  aria-controls={warningId}
                  aria-expanded={false}
                  onClick={() => setWarningMinimized(false)}
                >
                  <Icon icon="mdi:alert-circle-outline" width={24} aria-hidden="true" />
                </IconButton>
              </Tooltip>
            )}
            <ToggleButtonGroup
              onChange={handleChartVariantChange}
              size="small"
              aria-label={t('metric chooser')}
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
            </Box>
            <Box>
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
          </Box>
        )}
        {revisionMarkers.enabled && (
          <>
            {revisionMarkers.status === 'error' && (
              <Box id={warningId} hidden={warningMinimized}>
                <Alert
                  severity="warning"
                  sx={{ mb: 2 }}
                  action={
                    <IconButton
                      color="inherit"
                      size="small"
                      aria-label={t('Minimize revision marker warning')}
                      onClick={() => setWarningMinimized(true)}
                    >
                      <Icon icon="mdi:chevron-up" width={20} aria-hidden="true" />
                    </IconButton>
                  }
                >
                  {revisionMarkers.errorStatus === 403
                    ? t(
                        'Revision markers unavailable: permission to list workload revision history is required.'
                      )
                    : t('Could not load revision markers.')}
                  <Box component="details" ref={warningDetails} mt={1}>
                    <Box component="summary" sx={{ cursor: 'pointer' }}>
                      {t('Technical details')}
                    </Box>
                    <Box mt={1} sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                      {revisionMarkers.error}
                    </Box>
                  </Box>
                </Alert>
              </Box>
            )}
            {revisionMarkers.status === 'loaded' && revisionMarkers.markers.length === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {t('No retained revisions are available.')}
              </Alert>
            )}
          </>
        )}
        {state === prometheusState.INSTALLED ? (
          <Box
            style={{
              height: '400px',
            }}
          >
            {chartVariant === 'cpu' && (
              <CPUChart
                referenceLines={referenceLines}
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
                referenceLines={referenceLines}
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
                referenceLines={referenceLines}
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
                referenceLines={referenceLines}
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
  ...buttonProps
}: {
  label: string;
  icon: string;
  value: string;
} & Omit<ToggleButtonProps, 'value' | 'children'>) {
  return (
    <ToggleButton
      {...buttonProps}
      size="small"
      value={value}
      sx={{ textTransform: 'none', gap: 0.5, fontSize: 14 }}
    >
      <Icon icon={icon} width="18px" />
      {label}
    </ToggleButton>
  );
}
