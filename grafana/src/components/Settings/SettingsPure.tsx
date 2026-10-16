import { NameValueTable, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { MenuItem, Select } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import React from 'react';

export interface SettingsData {
  [cluster: string]: { grafanaUrl?: string };
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
  const grafanaUrl = selectedClusterData?.grafanaUrl || '';

  const settingsRows = [
    {
      name: 'Grafana URL',
      value: (
        <TextField
          fullWidth
          label="Grafana URL"
          inputProps={{ 'aria-label': 'Grafana URL' }}
          helperText={!validUrl && grafanaUrl ? 'Invalid URL' : 'Enter Grafana URL'}
          error={!validUrl && grafanaUrl !== ''}
          value={grafanaUrl}
          onChange={e => onUrlChange(e.target.value)}
        />
      ),
    },
  ];

  return (
    <SectionBox title="Settings">
      <FormControl sx={{ minWidth: 120 }} variant="outlined">
        <InputLabel id="Grafana-cluster-selector">Cluster</InputLabel>
        <Select
          labelId="Grafana-cluster-selector"
          id="Grafana-cluster-selector-select"
          label="Cluster"
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
        <FormHelperText>Clusters marked with "✓" have assigned Grafana URLs.</FormHelperText>
      </FormControl>
      <NameValueTable rows={settingsRows} />
    </SectionBox>
  );
};
