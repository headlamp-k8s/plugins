/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { pluginURL } from '../utils/url';

export function NotConfigured(): JSX.Element {
  const { t } = useTranslation();
  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="50vh">
      <Paper elevation={2} sx={{ p: 5, maxWidth: 480, textAlign: 'center', borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {t('PipeCD Not Configured')}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          {t(
            'Enter your PipeCD server URL and API key in the plugin settings to start viewing your deployments.'
          )}
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" component={RouterLink} to={pluginURL('/pipecd/settings')}>
            {t('Configure PipeCD')}
          </Button>
          <Button
            variant="outlined"
            href="https://pipecd.dev/docs/user-guide/managing-apikey/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('Get API Key')}
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" mt={3} display="block">
          {t('The API key requires at minimum the {{role}} role.', { role: 'READ_ONLY' })}
        </Typography>
      </Paper>
    </Box>
  );
}
