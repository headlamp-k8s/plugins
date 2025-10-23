import { PluginSettingsDetailsProps } from '@kinvolk/headlamp-plugin/lib/';
import { HoverInfoLabel, NameValueTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import { store } from '../charts/List';
import { EnableSwitch } from './EnableSwitch';

export type AppCatalogSettingsProps = PluginSettingsDetailsProps;

export function AppCatalogSettings({ data, onDataChange }: AppCatalogSettingsProps) {
  const config = data || store.get();

  const [currentConfig, setCurrentConfig] = useState<{ showOnlyVerified?: boolean }>(config);

  function handleSave(value: boolean) {
    console.log({ value, currentConfig, onDataChange, data });
    const updatedConfig = { showOnlyVerified: value };
    store.set(updatedConfig);
    setCurrentConfig(store.get());
    onDataChange?.(updatedConfig);
    return;
  }

  function toggleShowOnlyVerified() {
    const newShowOnlyVerified = !!currentConfig?.showOnlyVerified;
    handleSave(!newShowOnlyVerified);
  }

  return (
    <Box
      style={{
        marginTop: '3rem',
      }}
    >
      <Typography variant="h5">App Catalog Settings</Typography>
      <NameValueTable
        rows={[
          {
            name: (
              <HoverInfoLabel
                label="Only verified"
                hoverInfo="Show charts from verified publishers only"
              />
            ),
            value: (
              <EnableSwitch
                checked={!!currentConfig?.showOnlyVerified}
                onChange={toggleShowOnlyVerified}
              />
            ),
          },
        ]}
      />
    </Box>
  );
}
