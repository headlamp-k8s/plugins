import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';
import { NameValueTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import FormHelperText from '@mui/material/FormHelperText';
import Switch from '@mui/material/Switch';
import { useEffect, useState } from 'react';

interface AutoSaveSwitchProps {
  settingKey: keyof PluginConfig;
  onSave: (key: keyof PluginConfig, value: boolean) => void;
  defaultValue: boolean;
  helperText?: string | null;
}

function AutoSaveSwitch({
  settingKey,
  onSave,
  defaultValue,
  helperText = null,
}: AutoSaveSwitchProps) {
  const [value, setValue] = useState(defaultValue);
  const [timer, setTimer] = useState(null);

  const handleChange = event => {
    const newValue = event.target.checked;
    setValue(newValue);

    if (timer) {
      clearTimeout(timer);
    }

    const newTimer = setTimeout(() => onSave(settingKey, newValue), 100);
    setTimer(newTimer);
  };

  useEffect(() => {
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [timer]);

  return (
    <>
      <Switch checked={value} onChange={handleChange} />
      {helperText && <FormHelperText sx={{ ml: 1.75, mt: 0.5 }}>{helperText}</FormHelperText>}
    </>
  );
}

interface PluginConfig {
  linkHRelToKs: boolean;
}

const DEFAULT_CONFIG: PluginConfig = {
  linkHRelToKs: false,
};

export const store = new ConfigStore<PluginConfig>('@headlamp-k8s/flux');

export function FluxSettings() {
  const [currentConfig, setCurrentConfig] = useState<PluginConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...store.get(),
  }));

  function handleSave(key: keyof PluginConfig, value: boolean) {
    const updatedConfig = { ...currentConfig, [key]: value };
    store.set(updatedConfig);
    setCurrentConfig(updatedConfig);
  }

  const settingsRows = [
    {
      name: 'Link HelmReleases to Kustomizations instead of HelmRepositories',
      value: (
        <AutoSaveSwitch
          settingKey="linkHRelToKs"
          defaultValue={currentConfig?.linkHRelToKs}
          onSave={handleSave}
        />
      ),
    },
  ];

  return (
    <Box style={{ paddingTop: '8vh' }}>
      <Typography variant="h6">Map settings</Typography>
      <NameValueTable rows={settingsRows} />
    </Box>
  );
}
