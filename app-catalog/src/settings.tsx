import { HoverInfoLabel, NameValueTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Switch, SwitchProps, Typography, useTheme } from '@mui/material';
import { useState } from 'react';
import { store } from './components/charts/List';

export function AppCatalogSettings() {
  const config = store.get();

  const [currentConfig, setCurrentConfig] = useState(config);

  function handleSave(value) {
    const updatedConfig = { showOnlyVerified: value };
    store.set(updatedConfig);
    setCurrentConfig(store.get());
    return;
  }

  function toggleShowOnlyVerified() {
    const newShowOnlyVerified = currentConfig?.showOnlyVerified;
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
              <EnableSwitch checked={!!currentConfig?.showOnlyVerified} onChange={toggleShowOnlyVerified} />
            ),
          },
        ]}
      />
    </Box>
  );
}

const EnableSwitch = (props: SwitchProps) => {
  const theme = useTheme();

  return (
    <Switch
      focusVisibleClassName=".Mui-focusVisible"
      disableRipple
      sx={{
        width: 42,
        height: 26,
        padding: 0,
        '& .MuiSwitch-switchBase': {
          padding: 0,
          margin: '2px',

          transitionDuration: '300ms',
          '&.Mui-checked': {
            transform: 'translateX(16px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
              backgroundColor: theme.palette.mode === 'dark' ? '#2ECA45' : '#0078d4',
              opacity: 1,
              border: 0,
            },
            '&.Mui-disabled + .MuiSwitch-track': {
              opacity: 0.5,
            },
          },
          '&.Mui-focusVisible .MuiSwitch-thumb': {
            color: '#33cf4d',
            border: '6px solid #fff',
          },
          '&.Mui-disabled .MuiSwitch-thumb': {
            color:
              theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[600],
          },
          '&.Mui-disabled + .MuiSwitch-track': {
            opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
          },
        },
        '& .MuiSwitch-thumb': {
          boxSizing: 'border-box',
          width: 22,
          height: 22,
        },
        '& .MuiSwitch-track': {
          borderRadius: 26 / 2,
          backgroundColor: theme.palette.mode === 'light' ? '#E9E9EA' : '#39393D',
          opacity: 1,
          transition: theme.transitions.create(['background-color'], {
            duration: 500,
          }),
        },
      }}
      {...props}
    />
  );
};
