import { NameValueTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useClustersConf } from '@kinvolk/headlamp-plugin/lib/k8s';
import Box from '@mui/material/Box';
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
 * Settings component for configuring Prometheus metrics.
 * @param {Object} props - The properties passed to the component.
 * @param {Object} props.data - The current configuration data.
 * @param {Function} props.onDataChange - The function to call when the data changes.
 * @returns {JSX.Element} The Settings component.
 */
export function Settings(props) {
  const { data, onDataChange } = props;
  const [selectedCluster, setSelectedCluster] = useState('');
  const [addressError, setAddressError] = useState(false);

  const clusters = useClustersConf() || {};

  useEffect(() => {
    if (Object.keys(clusters).length > 0 && !selectedCluster) {
      setSelectedCluster(Object.keys(clusters)[0]);
    }
  }, [clusters, selectedCluster]);

  const selectedClusterData = data?.[selectedCluster] || {};
  const isMetricsEnabled = selectedClusterData.isMetricsEnabled ?? true;
  const isAutoDetectEnabled = isMetricsEnabled && (selectedClusterData.autoDetect ?? true);
  const isAddressFieldEnabled = isMetricsEnabled && !isAutoDetectEnabled;

  useEffect(() => {
    if (selectedClusterData.address) {
      setAddressError(!isValidAddress(selectedClusterData.address));
    } else {
      setAddressError(false);
    }
  }, [selectedClusterData.address]);

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
      ),
    },
    {
      name: 'Default timespan',
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
