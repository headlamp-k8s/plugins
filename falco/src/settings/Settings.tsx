import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useState } from 'react';
import RedisConnectionTester from '../components/RedisConnectionTester';
import { FalcoSettings, loadSettings, saveSettings } from '../utils/storageUtils';

/**
 * The Settings component.
 * @returns The Settings component.
 */
export default function Settings() {
  const [settings, setSettings] = useState<FalcoSettings>(loadSettings());
  const [pendingSettings, setPendingSettings] = useState<FalcoSettings>(loadSettings());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

  const handleBackendChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const backend = e.target.value as 'file' | 'redis';
    setPendingSettings(prev => ({ ...prev, backend }));
  };

  const handleRedisUrlChange = (value: string) => {
    setPendingSettings(prev => ({ ...prev, redisUrl: value }));
  };

  const handleSaveSettings = () => {
    // Apply pending settings
    setSettings(pendingSettings);
    saveSettings(pendingSettings);
    // Show success feedback
    setSaveStatus('success');
    // Reset status after 3 seconds
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const isSettingsChanged = JSON.stringify(settings) !== JSON.stringify(pendingSettings);

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Typography variant="h5">Event Storage Settings</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveSettings}
              disabled={!isSettingsChanged}
            >
              Save
            </Button>
          </Box>

          {/* Status alert in fixed position below header */}
          <Box sx={{ height: 32 }}>
            {saveStatus === 'success' && (
              <Alert severity="success" sx={{ py: 0 }}>
                Settings saved!
              </Alert>
            )}
          </Box>
        </Box>
        <TextField
          select
          label="Backend Type"
          value={pendingSettings.backend}
          onChange={handleBackendChange}
          fullWidth
          margin="normal"
        >
          <MenuItem value="file">File (default, volume-based)</MenuItem>
          <MenuItem value="redis">Redis (external)</MenuItem>
        </TextField>
        {pendingSettings.backend === 'redis' && (
          <Box>
            <TextField
              label="Redis REST Proxy URL (optional)"
              value={pendingSettings.redisUrl}
              onChange={e => handleRedisUrlChange(e.target.value)}
              fullWidth
              margin="normal"
              helperText="Leave blank to use in-cluster proxy /api/v1/namespaces/falco/services/redis-rest-proxy:8080/proxy"
            />
            <RedisConnectionTester redisUrl={settings.redisUrl} />
          </Box>
        )}
      </Paper>
    </Box>
  );
}
