import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
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
    }
  >;
  onDataChange: (newData: SettingsProps['data']) => void;
}

/**
 * Settings component for configuring Prometheus metrics.
 */
export function Settings(props: SettingsProps) {
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

  useEffect(() => {
    if (selectedCluster && !data?.[selectedCluster]) {
      onDataChange({
        ...data,
        [selectedCluster]: {
          isMetricsEnabled: true,
          autoDetect: true,
          defaultTimespan: '24h',
          defaultResolution: 'medium',
        },
      });
    }
  }, [selectedCluster, data, onDataChange]);

  const selectedClusterData = data?.[selectedCluster] || {};
  const isMetricsEnabled = selectedClusterData.isMetricsEnabled ?? true;
  const isAutoDetectEnabled = isMetricsEnabled && (selectedClusterData.autoDetect ?? true);
  const isAddressFieldEnabled = isMetricsEnabled && !isAutoDetectEnabled;

  useEffect(() => {
    if (selectedClusterData.address) {
      setAddressError(!isValidAddress(selectedClusterData.address));
      setTestStatus('idle');
      setTestMessage('');
    } else {
      setAddressError(false);
    }
  }, [selectedClusterData.address]);

  const handleTestConnection = async () => {
    if (!selectedClusterData.address || !isValidAddress(selectedClusterData.address)) {
      setAddressError(true);
      setTestMessage('Invalid Address Format');
      setTestStatus('error');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Testing Connection');

    try {
      const [namespace, serviceAndPort] = selectedClusterData.address.split('/');
      const [service, port] = serviceAndPort.split(':');

      let subPath = selectedClusterData.subPath || '';
      if (subPath && !subPath.startsWith('/')) {
        subPath = '/' + subPath;
      }

      const proxyUrl = `/clusters/${selectedCluster}/api/v1/namespaces/${namespace}/services/${service}:${port}/proxy${subPath}/-/healthy`;
      await request(proxyUrl);

      setTestStatus('success');
      setTestMessage('Connection successful!');
    } catch (err) {
      setTestStatus('error');
      const errorMessage = err instanceof Error ? err.message : String(err);
      setTestMessage(`Connection failed: ${errorMessage}`);
      console.error(err);
    }
  };

  const settingsRows = [
    {
      name: 'Enable Metrics',
      value: (
        <Switch
          checked={isMetricsEnabled}
          onChange={e => {
            const newMetricsEnabled = e.target.checked;
            onDataChange({
              ...(data || {}),
              [selectedCluster]: {
                ...((data || {})[selectedCluster] || {}),
                isMetricsEnabled: newMetricsEnabled,
                autoDetect: newMetricsEnabled ? data?.[selectedCluster]?.autoDetect ?? true : false,
              },
            });
          }}
        />
      ),
    },
    {
      name: 'Auto detect',
      value: (
        <Switch
          disabled={!isMetricsEnabled}
          checked={isAutoDetectEnabled}
          onChange={e =>
            onDataChange({
              ...(data || {}),
              [selectedCluster]: {
                ...((data || {})[selectedCluster] || {}),
                autoDetect: e.target.checked,
              },
            })
          }
        />
      ),
    },
    {
      name: 'Prometheus Service Address',
      value: (
        <Box display="flex" flexDirection="column" width="100%">
          <Box display="flex" gap={2} alignItems="flex-start">
            <TextField
              disabled={!isAddressFieldEnabled}
              helperText={
                addressError
                  ? 'Invalid format. Use: namespace/service-name:port'
                  : 'Address of the Prometheus Service, only used when auto-detection is disabled. Format: namespace/service-name:port'
              }
              error={addressError}
              value={selectedClusterData.address || ''}
              onChange={e => {
                const newAddress = e.target.value;
                onDataChange({
                  ...(data || {}),
                  [selectedCluster]: {
                    ...((data || {})[selectedCluster] || {}),
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
                !selectedClusterData.address ||
                testStatus === 'testing'
              }
              onClick={handleTestConnection}
              sx={{ mt: 1, minWidth: '100px' }}
            >
              Test Connection
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
      name: 'Prometheus Service Subpath',
      value: (
        <TextField
          value={selectedClusterData.subPath || ''}
          disabled={!isAddressFieldEnabled}
          helperText="Optional subpath to the Prometheus Service endpoint. Only used when auto-detection is disabled. Examples: 'prometheus'."
          onChange={e => {
            const newSubPath = e.target.value;
            onDataChange({
              ...(data || {}),
              [selectedCluster]: { ...((data || {})[selectedCluster] || {}), subPath: newSubPath },
            });
          }}
        />
      ),
    },
    {
      name: 'Default Timespan',
      value: (
        <Select
          disabled={!isMetricsEnabled}
          value={data?.[selectedCluster]?.defaultTimespan || '24h'}
          onChange={e =>
            onDataChange({
              ...(data || {}),
              [selectedCluster]: {
                ...((data || {})[selectedCluster] || {}),
                defaultTimespan: e.target.value,
              },
            })
          }
        >
          <MenuItem value={'10m'}>10 minutes</MenuItem>
          <MenuItem value={'30m'}>30 minutes</MenuItem>
          <MenuItem value={'1h'}>1 hour</MenuItem>
          <MenuItem value={'3h'}>3 hours</MenuItem>
          <MenuItem value={'6h'}>6 hours</MenuItem>
          <MenuItem value={'12h'}>12 hours</MenuItem>
          <MenuItem value={'24h'}>24 hours</MenuItem>
          <MenuItem value={'48h'}>48 hours</MenuItem>
          <MenuItem value={'today'}>Today</MenuItem>
          <MenuItem value={'yesterday'}>Yesterday</MenuItem>
          <MenuItem value={'week'}>Week</MenuItem>
          <MenuItem value={'lastweek'}>Last week</MenuItem>
          <MenuItem value={'7d'}>7 days</MenuItem>
          <MenuItem value={'14d'}>14 days</MenuItem>
        </Select>
      ),
    },
    {
      name: 'Default Resolution',
      value: (
        <Select
          disabled={!isMetricsEnabled}
          value={data?.[selectedCluster]?.defaultResolution || 'medium'}
          onChange={e =>
            onDataChange({
              ...(data || {}),
              [selectedCluster]: {
                ...((data || {})[selectedCluster] || {}),
                defaultResolution: e.target.value,
              },
            })
          }
        >
          <ListSubheader>Automatic resolution</ListSubheader>
          <MenuItem value="low">Low res.</MenuItem>
          <MenuItem value="medium">Medium res.</MenuItem>
          <MenuItem value="high">High res.</MenuItem>

          <ListSubheader>Fixed resolution</ListSubheader>
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
        <Typography variant="h6">Select Cluster</Typography>
        <Select value={selectedCluster} onChange={e => setSelectedCluster(e.target.value)}>
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
