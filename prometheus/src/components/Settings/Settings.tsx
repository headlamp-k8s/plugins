import { NameValueTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useClustersConf } from '@kinvolk/headlamp-plugin/lib/k8s';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { ClusterData } from '../../util';

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
 * Custom hook to fetch and manage basic auth credentials from a secret
 */
function useBasicAuthCredentials(
  cluster: string,
  clusterData: ClusterData,
  onDataChange: (newData: SettingsProps['data']) => void,
  data: SettingsProps['data']
) {
  const [error, setError] = useState<string>('');
  const basicAuth = clusterData?.basicAuth;

  const [secret, secretError] = K8s.ResourceClasses.Secret.useGet(
    basicAuth?.secret?.name,
    basicAuth?.secret?.namespace,
    {cluster : cluster},
  );

  useEffect(() => {
    if (!clusterData?.isBasicAuthEnabled) {
      setError('');
      // Clear credentials when basic auth is disabled
      if (clusterData?.basicAuth?.credentials) {
        onDataChange({
          ...data,
          [cluster]: {
            ...clusterData,
            basicAuth: {
              ...clusterData.basicAuth,
              credentials: undefined
            }
          }
        });
      }
      return;
    }

    if (!basicAuth?.secret?.name || !basicAuth?.secret?.namespace) {
      setError('Secret name and namespace are required');
      return;
    }

    if (secretError) {
      setError(`Failed to fetch secret: ${secretError.message}`);
      return;
    }

    if (!secret) {
      setError('No secret data available');
      return;
    }

    const usernameKey = basicAuth?.secret?.keys?.username || 'username';
    const passwordKey = basicAuth?.secret?.keys?.password || 'password';

    const username = secret.data?.[usernameKey];
    const password = secret.data?.[passwordKey];

    if (!username || !password) {
      setError(`Secret missing required keys: ${usernameKey} and/or ${passwordKey}`);
      return;
    }

    // Update the credentials in the cluster data
    onDataChange({
      ...data,
      [cluster]: {
        ...clusterData,
        basicAuth: {
          ...clusterData.basicAuth,
          credentials: {
            username: atob(username), // decode base64
            password: atob(password)
          }
        }
      }
    });
    setError('');
  }, [secret, clusterData.isBasicAuthEnabled]);

  return error;
}

/**
 * Props for the Settings component.
 * @interface SettingsProps
 * @property {Object.<string, {isMetricsEnabled?: boolean, autoDetect?: boolean, address?: string, defaultTimespan?: string}>} data - Configuration data for each cluster
 * @property {Function} onDataChange - Callback function when data changes
 */
interface SettingsProps {
  data: Record<string, ClusterData>;
  onDataChange: (newData: SettingsProps['data']) => void;
}

/**
 * Settings component for configuring Prometheus metrics.
 */
export function Settings(props: SettingsProps) {
  const { data, onDataChange } = props;
  const [selectedCluster, setSelectedCluster] = useState('');
  const [addressError, setAddressError] = useState(false);

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
          isBasicAuthEnabled: false,
        },
      });
    }
  }, [selectedCluster, data, onDataChange]);

  const selectedClusterData = data?.[selectedCluster] || {};
  const isMetricsEnabled = selectedClusterData.isMetricsEnabled ?? true;
  const isAutoDetectEnabled = isMetricsEnabled && (selectedClusterData.autoDetect ?? true);
  const isAddressFieldEnabled = isMetricsEnabled && !isAutoDetectEnabled;
  const isBasicAuthEnabled = isMetricsEnabled && (selectedClusterData.isBasicAuthEnabled ?? false);

  // Use the new hook
  const basicAuthError = useBasicAuthCredentials(
    selectedCluster,
    selectedClusterData,
    onDataChange,
    data
  );

  const settingsRows = [
    {
      name: 'Enable Metrics',
      value: (
        <Switch
          checked={isMetricsEnabled}
          onChange={e => {
            const newMetricsEnabled = e.target.checked;
            onDataChange({
              ...data,
              [selectedCluster]: {
                ...selectedClusterData,
                isMetricsEnabled: newMetricsEnabled,
                autoDetect: newMetricsEnabled ? (selectedClusterData.autoDetect ?? true) : false,
                isBasicAuthEnabled: newMetricsEnabled ? (selectedClusterData.isBasicAuthEnabled ?? false) : false,
              },
            });
          }}
        />
      ),
    },
    {
      name: 'Auto detect',
      hide: !isMetricsEnabled,
      value: (
        <Switch
          disabled={!isMetricsEnabled}
          checked={isAutoDetectEnabled}
          onChange={e =>
            onDataChange({
              ...data,
              [selectedCluster]: {
                ...selectedClusterData,
                autoDetect: e.target.checked,
              },
            })
          }
        />
      ),
    },
    {
      name: 'Prometheus Service Address',
      hide: !isAddressFieldEnabled,
      value: (
        <TextField fullWidth
          disabled={!isAddressFieldEnabled}
          label='Address of the Prometheus Service'
          helperText={
            addressError
              ? 'Invalid format. Use: namespace/service-name:port'
              : 'Format: namespace/service-name:port'
          }
          error={addressError}
          value={selectedClusterData.address || ''}
          onChange={e => {
            const newAddress = e.target.value;
            onDataChange({
              ...data,
              [selectedCluster]: {
                ...selectedClusterData,
                address: newAddress,
              },
            });
            if (newAddress) {
              setAddressError(!isValidAddress(newAddress));
            } else {
              setAddressError(false);
            }
          }}
        />
      ),
    },
    {
      name: 'Enable Basic Authorization',
      hide: !isMetricsEnabled,
      value: (
        <Switch
          disabled={!isMetricsEnabled}
          checked={isBasicAuthEnabled}
          onChange={e => {
            const newBasicAuthEnabled = e.target.checked;
            onDataChange({
              ...data,
              [selectedCluster]: {
                ...selectedClusterData,
                isBasicAuthEnabled: newBasicAuthEnabled,
              },
            });
          }}
        />
      ),
    },
    {
      name: 'Basic Authorization',
      hide: !isBasicAuthEnabled,
      value: (
        <Box p={2}>
            {basicAuthError && (
            <Typography variant="body2" color="error">
              {basicAuthError}
            </Typography>
          )}
          <TextField fullWidth margin="dense"
            disabled={!isBasicAuthEnabled}
            label='Secret name'
            value={selectedClusterData.basicAuth?.secret?.name || ''}
            onChange={e => {
              onDataChange({
                ...data,
                [selectedCluster]: {
                  ...selectedClusterData,
                  basicAuth: {
                    ...selectedClusterData.basicAuth,
                    secret: {
                      ...selectedClusterData.basicAuth?.secret,
                      name: e.target.value,
                    },
                  },
                },
              });
            }}
          />
          <TextField fullWidth margin="dense"
            disabled={!isBasicAuthEnabled}
            label='Secret namespace'
            helperText="Defaults to Headlamp's namespace"
            value={selectedClusterData.basicAuth?.secret?.namespace || ''}
            onChange={e => {
              onDataChange({
                ...data,
                [selectedCluster]: {
                  ...selectedClusterData,
                  basicAuth: {
                    ...selectedClusterData.basicAuth,
                    secret: {
                      ...selectedClusterData.basicAuth?.secret,
                      namespace: e.target.value,
                    },
                  },
                },
              });
            }}
          />
          <TextField fullWidth margin="dense"
            disabled={!isBasicAuthEnabled}
            label='Username key'
            value={selectedClusterData.basicAuth?.secret?.keys?.username || 'username'}
            onChange={e => {
              onDataChange({
                ...data,
                [selectedCluster]: {
                  ...selectedClusterData,
                  basicAuth: {
                    ...selectedClusterData.basicAuth,
                    secret: {
                      ...selectedClusterData.basicAuth?.secret,
                      keys: {
                        ...(selectedClusterData.basicAuth?.secret?.keys || {}),
                        username: e.target.value,
                      }
                    },
                  },
                },
              });
            }}
          />
          <TextField fullWidth margin="dense"
            disabled={!isBasicAuthEnabled}
            label='Password key'
            value={selectedClusterData.basicAuth?.secret?.keys?.password || 'password'}
            onChange={e => {
              onDataChange({
                ...data,
                [selectedCluster]: {
                  ...selectedClusterData,
                  basicAuth: {
                    ...selectedClusterData.basicAuth,
                    secret: {
                      ...selectedClusterData.basicAuth?.secret,
                      keys: {
                        ...selectedClusterData.basicAuth?.secret?.keys,
                        password: e.target.value,
                      }
                    },
                  },
                },
              });
            }}
          />
        </Box>
      ),
    },
    {
      name: 'Default timespan',
      hide: !isMetricsEnabled,
      value: (
        <Select
          disabled={!isMetricsEnabled}
          value={data?.[selectedCluster]?.defaultTimespan || '24h'}
          onChange={e =>
            onDataChange({
              ...data,
              [selectedCluster]: {
                ...selectedClusterData,
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
