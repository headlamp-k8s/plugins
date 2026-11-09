import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { NameValueTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useClustersConf } from '@kinvolk/headlamp-plugin/lib/k8s';
import { Button } from '@mui/material';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import type { ClusterData } from '../../../util';
import { fetchDeploymentConfig } from '../../../util';

/**
 * Validates if the given address string is in the correct format.
 * The format should be: namespace/service:port
 *
 * @param {string} address - The address string to validate.
 * @returns {boolean} True if the address is valid, false otherwise.
 */
function isValidAddress(address: string): boolean {
  const regex = /^[a-z0-9-]+\/[a-z0-9-]+:[0-9]+$/;
  return regex.test(address);
}

/**
 * Props for the Settings component.
 * @interface SettingsProps
 * @property {Object.<string, {isMetricsEnabled?: boolean, autoDetect?: boolean, address?: string, defaultTimespan?: string, defaultResolution?: string}>} data - Configuration data for each cluster
 * @property {Function} onDataChange - Callback function when data changes
 */
interface SettingsProps {
  data: Record<
    string,
    {
      isMetricsEnabled?: boolean;
      autoDetect?: boolean;
      address?: string;
      subPath?: string;
      defaultTimespan?: string;
      defaultResolution?: string;
      /** Exact Prometheus job label for one Tinkerbell installation. */
      tinkerbellJob?: string;
    }
  >;
  onDataChange: (newData: SettingsProps['data']) => void;
}

/**
 * Settings component for configuring Prometheus metrics.
 */
export function Settings(props: SettingsProps) {
  const { t } = useTranslation();
  const { data, onDataChange } = props;
  const [selectedCluster, setSelectedCluster] = useState('');
  const [addressError, setAddressError] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const request = ApiProxy.request;

  const clusters = useClustersConf() || {};

  useEffect(() => {
    if (Object.keys(clusters).length > 0 && !selectedCluster) {
      setSelectedCluster(Object.keys(clusters)[0]);
    }
  }, [clusters, selectedCluster]);

  const [deploymentConfig, setDeploymentConfig] = useState<Partial<ClusterData>>({});
  useEffect(() => {
    let cancelled = false;
    setDeploymentConfig({});
    if (!selectedCluster) return;
    fetchDeploymentConfig(selectedCluster).then(config => {
      if (!cancelled) setDeploymentConfig(config);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedCluster]);

  const userClusterData = data?.[selectedCluster] || {};
  
  const isMetricsEnabled = userClusterData.isMetricsEnabled ?? deploymentConfig.isMetricsEnabled ?? true;
  const isAutoDetectEnabled = isMetricsEnabled && (userClusterData.autoDetect ?? deploymentConfig.autoDetect ?? true);
  const isAddressFieldEnabled = isMetricsEnabled && !isAutoDetectEnabled;
  
  const effectiveAddress = userClusterData.address ?? deploymentConfig.address ?? '';
  const effectiveSubPath = userClusterData.subPath ?? deploymentConfig.subPath ?? '';
  const effectiveTimespan = userClusterData.defaultTimespan ?? deploymentConfig.defaultTimespan ?? '24h';
  const effectiveResolution = userClusterData.defaultResolution ?? deploymentConfig.defaultResolution ?? 'medium';

  useEffect(() => {
    if (effectiveAddress) {
      setAddressError(!isValidAddress(effectiveAddress));
      setTestStatus('idle');
      setTestMessage('');
    } else {
      setAddressError(false);
    }
  }, [effectiveAddress]);

  const handleTestConnection = async () => {
    if (!effectiveAddress || !isValidAddress(effectiveAddress)) {
      setAddressError(true);
      setTestMessage(t('Invalid Address Format'));
      setTestStatus('error');
      return;
    }

    setTestStatus('testing');
    setTestMessage(t('Testing Connection'));

    try {
      const [namespace, serviceAndPort] = effectiveAddress.split('/');
      const [service, port] = serviceAndPort.split(':');

      let subPath = effectiveSubPath;
      if (subPath && !subPath.startsWith('/')) {
        subPath = '/' + subPath;
      }

      // Standard Prometheus servers return a plain-text body from /-/healthy
      // (e.g. "Prometheus Server is Healthy."), which isn't valid JSON. Some
      // setups also return non-JSON error pages for other statuses. Testing
      // against the query API instead gets us a real JSON response either
      // way, and it verifies the query engine actually works, not just that
      // something is listening on the port.
      const normalizedSubPath = subPath.replace(/\/+$/, '');
      const queryParams = new URLSearchParams({ query: '1' });
      const proxyUrl = `/clusters/${selectedCluster}/api/v1/namespaces/${namespace}/services/${service}:${port}/proxy${normalizedSubPath}/api/v1/query?${queryParams.toString()}`;
      const response = await request(proxyUrl, {
        method: 'GET',
      });

      if (response?.status !== 'success') {
        const detail =
          typeof (response as any)?.error === 'string' && (response as any).error.trim()
            ? (response as any).error.trim()
            : response?.status ?? 'unknown';
        throw new Error(t('Unexpected response from Prometheus: {{ detail }}', { detail }));
      }

      setTestStatus('success');
      setTestMessage(t('Connection successful!'));
    } catch (err) {
      setTestStatus('error');
      const errorMessage = err instanceof Error ? err.message : String(err);
      setTestMessage(t('Connection failed: {{ errorMessage }}', { errorMessage }));
      console.error(err);
    }
  };

  const settingsRows = [
    {
      name: t('Enable Metrics'),
      value: (
        <Switch
          inputProps={{ 'aria-label': t('Enable Metrics') }}
          checked={isMetricsEnabled}
          onChange={e => {
            const newMetricsEnabled = e.target.checked;
            onDataChange({
              ...(data || {}),
              [selectedCluster]: {
                ...userClusterData,
                isMetricsEnabled: newMetricsEnabled,
                autoDetect: newMetricsEnabled ? userClusterData.autoDetect ?? deploymentConfig.autoDetect ?? true : false,
              },
            });
          }}
        />
      ),
    },
    {
      name: t('Auto detect'),
      value: (
        <Switch
          inputProps={{ 'aria-label': t('Auto detect') }}
          disabled={!isMetricsEnabled}
          checked={isAutoDetectEnabled}
          onChange={e =>
            onDataChange({
              ...(data || {}),
              [selectedCluster]: {
                ...userClusterData,
                autoDetect: e.target.checked,
              },
            })
          }
        />
      ),
    },
    {
      name: t('Prometheus Service Address'),
      value: (
        <Box display="flex" flexDirection="column" width="100%">
          <Box display="flex" gap={2} alignItems="flex-start">
            <TextField
              inputProps={{ 'aria-label': t('Prometheus Service Address') }}
              disabled={!isAddressFieldEnabled}
              helperText={
                addressError
                  ? t('Invalid format. Use: namespace/service-name:port')
                  : t(
                      'Address of the Prometheus Service. If left blank, the deployment default is used.'
                    )
              }
              error={addressError}
              value={userClusterData.address || ''}
              placeholder={deploymentConfig.address || ''}
              onChange={e => {
                const newAddress = e.target.value;
                onDataChange({
                  ...(data || {}),
                  [selectedCluster]: {
                    ...userClusterData,
                    address: newAddress,
                  },
                });
                setAddressError(!isValidAddress(newAddress));
              }}
            />
            <Button
              variant="contained"
              disabled={
                !isAddressFieldEnabled ||
                addressError ||
                !effectiveAddress ||
                testStatus === 'testing'
              }
              onClick={handleTestConnection}
              sx={{ mt: 1, minWidth: '100px' }}
            >
              {t('Test Connection')}
            </Button>
          </Box>
          {testStatus !== 'idle' && testMessage && (
            <Alert
              severity={testStatus === 'success' ? 'success' : 'error'}
              sx={{ mt: 2, width: 'fit-content' }}
            >
              {testMessage}
            </Alert>
          )}
        </Box>
      ),
    },
    {
      name: t('Prometheus Service Subpath'),
      value: (
        <TextField
          inputProps={{ 'aria-label': t('Prometheus Service Subpath') }}
          value={userClusterData.subPath || ''}
          placeholder={deploymentConfig.subPath || ''}
          disabled={!isAddressFieldEnabled}
          helperText={t(
            "Optional subpath to the Prometheus Service endpoint. Examples: 'prometheus'. If left blank, the deployment default is used."
          )}
          onChange={e => {
            const newSubPath = e.target.value;
            onDataChange({
              ...(data || {}),
              [selectedCluster]: { ...userClusterData, subPath: newSubPath },
            });
          }}
        />
      ),
    },
    {
      name: t('Tinkerbell Scrape Job'),
      value: (
        <TextField
          inputProps={{ 'aria-label': t('Tinkerbell Scrape Job') }}
          disabled={!isMetricsEnabled}
          value={userClusterData.tinkerbellJob ?? 'tinkerbell'}
          onChange={e =>
            onDataChange({
              ...(data || {}),
              [selectedCluster]: { ...userClusterData, tinkerbellJob: e.target.value },
            })
          }
        />
      ),
    },
    {
      name: t('Default Timespan'),
      value: (
        <Select
          inputProps={{ 'aria-label': t('Default Timespan') }}
          disabled={!isMetricsEnabled}
          value={effectiveTimespan}
          onChange={e =>
            onDataChange({
              ...(data || {}),
              [selectedCluster]: {
                ...userClusterData,
                defaultTimespan: e.target.value,
              },
            })
          }
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
      ),
    },
    {
      name: t('Default Resolution'),
      value: (
        <Select
          inputProps={{ 'aria-label': t('Default Resolution') }}
          disabled={!isMetricsEnabled}
          value={effectiveResolution}
          onChange={e =>
            onDataChange({
              ...(data || {}),
              [selectedCluster]: {
                ...userClusterData,
                defaultResolution: e.target.value,
              },
            })
          }
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
      ),
    },
  ];

  return (
    <Box width={'80%'}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">{t('Select Cluster')}</Typography>
        <Select
          inputProps={{ 'aria-label': t('Select Cluster') }}
          value={selectedCluster}
          onChange={e => setSelectedCluster(e.target.value)}
        >
          {Object.keys(clusters).map(clusterName => (
            <MenuItem key={clusterName} value={clusterName}>
              {clusterName}
            </MenuItem>
          ))}
        </Select>
      </Box>
      <NameValueTable rows={settingsRows} />
    </Box>
  );
}
