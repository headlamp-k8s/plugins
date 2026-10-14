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
import { Box, CircularProgress, Link as MuiLink, Typography } from '@mui/material';
import { Trans } from 'react-i18next';

interface NotInstalledBannerProps {
  isLoading?: boolean;
}

export function NotInstalledBanner({ isLoading = false }: NotInstalledBannerProps) {
  const { t, i18n, ready } = useTranslation();

  const notInstalledMessage =
    ready && i18n
      ? t("Knative was not detected on your cluster. If you haven't already, please install it.")
      : "Knative was not detected on your cluster. If you haven't already, please install it.";

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2} minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" p={2} minHeight="200px">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          width: '100%',
          maxWidth: 900,
          textAlign: 'center',
        }}
      >
        <Typography variant="h5">{notInstalledMessage}</Typography>
        <Typography>
          {/* t() returns '' until ready and Trans needs the plugin's i18n instance, so show the
              English text until both are available. */}
          {ready && i18n ? (
            <Trans
              t={t}
              // This plugin bundles its own react-i18next, so Trans has no default instance;
              // pass the plugin's i18n instance (null until initialized).
              i18n={i18n}
              i18nKey="Learn how to <install>install</install> Knative"
              components={{
                install: (
                  <MuiLink
                    href="https://knative.dev/docs/install/"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
              }}
            />
          ) : (
            <>
              Learn how to{' '}
              <MuiLink
                href="https://knative.dev/docs/install/"
                target="_blank"
                rel="noopener noreferrer"
              >
                install
              </MuiLink>{' '}
              Knative
            </>
          )}
        </Typography>
      </Box>
    </Box>
  );
}
