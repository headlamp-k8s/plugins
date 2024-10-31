import { NameValueTable, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { MenuItem, Select } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
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
    <SectionBox title="Settings">
      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel id="backstage-cluster-selector">Cluster</InputLabel>
        <Select
          labelId="backstage-cluster-selector"
          id="backstage-cluster-selector-select"
          value={selectedCluster}
          onChange={e => onClusterChange(e.target.value as string)}
          renderValue={value => value}
        >
          {Object.keys(clusters).map(clusterName => (
            <MenuItem key={clusterName} value={clusterName}>
              {data?.[clusterName] ? `✓ ${clusterName}` : clusterName}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>Clusters marked with "✓" have assigned Backstage URLs.</FormHelperText>
      </FormControl>
      <NameValueTable rows={settingsRows} />
    </SectionBox>
  );
};
