import { NameValueTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, MenuItem, Select, Typography } from '@mui/material';
import TextField from '@mui/material/TextField';
import React from 'react';

export interface SettingsData {
  [cluster: string]: { backstageUrl?: string };
}

export interface SettingsPureProps {
  data: SettingsData;
  clusters: Record<string, any>;
  selectedCluster: string;
  validUrl: boolean;
  onClusterChange: (cluster: string) => void;
  onUrlChange: (url: string) => void;
}

export const SettingsPure: React.FC<SettingsPureProps> = ({
  data,
  clusters,
  selectedCluster,
  validUrl,
  onClusterChange,
  onUrlChange,
}) => {
  const selectedClusterData = data?.[selectedCluster] || {};
  const backstageUrl = selectedClusterData?.backstageUrl || '';

  const settingsRows = [
    {
      name: 'Backstage URL',
      value: (
        <TextField
          helperText={!validUrl && backstageUrl ? 'Invalid URL' : 'Enter Backstage URL'}
          error={!validUrl && backstageUrl !== ''}
          value={backstageUrl}
          onChange={e => onUrlChange(e.target.value)}
        />
      ),
    },
  ];

  return (
    <Box width="80%">
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Select Cluster</Typography>
        <Select value={selectedCluster} onChange={e => onClusterChange(e.target.value as string)}>
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
};
