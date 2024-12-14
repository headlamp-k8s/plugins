import { NameValueTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useClustersConf } from '@kinvolk/headlamp-plugin/lib/k8s';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';

export const DEFAULT_NODE_SHELL_LINUX_IMAGE = 'docker.io/library/alpine:latest'

/**
 * Props for the Settings component.
 * @interface SettingsProps
 * @property {Object.<string, {isMetricsEnabled?: boolean, autoDetect?: boolean, address?: string, defaultTimespan?: string}>} data - Configuration data for each cluster
 * @property {Function} onDataChange - Callback function when data changes
 */
interface SettingsProps {
  data: Record<
    string,
    {
      image?: string;
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
        [selectedCluster]: { image: DEFAULT_NODE_SHELL_LINUX_IMAGE},
      });
    }
  }, [selectedCluster, data, onDataChange]);

  const selectedClusterData = data?.[selectedCluster] || {};

  const settingsRows = [
    {
      name: 'Node Shell Linux Image',
      value: (
        <TextField
          value={selectedClusterData.image || ''}
          onChange={e => {
            const newImage = e.target.value;
            onDataChange({
              ...(data || {}),
              [selectedCluster]: {
                ...((data || {})[selectedCluster] || {}),
                image: newImage,
              },
            });
          }}
          placeholder={DEFAULT_NODE_SHELL_LINUX_IMAGE}
          helperText={'The default image is used for dropping a shell into a node (when not specified directly).'}
        />
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
