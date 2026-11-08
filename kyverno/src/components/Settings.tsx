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

import type { PluginSettingsDetailsProps } from '@kinvolk/headlamp-plugin/lib';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Box, Switch, Typography } from '@mui/material';
import type { KyvernoConfig } from '../config';

export function Settings({ data, onDataChange }: PluginSettingsDetailsProps) {
  const { t } = useTranslation();
  const config = data as Partial<KyvernoConfig> | undefined;
  const enabled = config?.policyEngineHealthEnabled === true;

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box>
          <Typography variant="body1" fontWeight={500}>
            {t('Policy Engine Health')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {t(
              'Show live admission metrics on the Overview page. Requires Prometheus on this cluster.'
            )}
          </Typography>
        </Box>
        <Switch
          checked={enabled}
          onChange={(_event, checked) =>
            onDataChange?.({ ...config, policyEngineHealthEnabled: checked })
          }
          inputProps={{ 'aria-label': t('Enable Policy Engine Health section') }}
          sx={{ ml: 3, flexShrink: 0 }}
        />
      </Box>
    </Box>
  );
}
