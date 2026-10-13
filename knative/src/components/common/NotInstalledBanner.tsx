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

import { Box, CircularProgress, Link as MuiLink, Typography } from '@mui/material';
import type { KnativeComponent } from '../../isKnativeInstalled';

const COMPONENT_BANNER: Record<KnativeComponent, { productName: string; installUrl: string }> = {
  serving: {
    productName: 'Knative Serving',
    installUrl: 'https://knative.dev/docs/install/',
  },
  eventing: {
    productName: 'Knative Eventing',
    installUrl:
      'https://knative.dev/docs/install/yaml-install/eventing/install-eventing-with-yaml/',
  },
};

/** Props of {@link NotInstalledBanner}. */
interface NotInstalledBannerProps {
  /** Shows a spinner instead of the message while the install check runs. */
  isLoading?: boolean;
  /** The Knative component that is missing; defaults to `serving`. */
  component?: KnativeComponent;
}

/**
 * Tells the user that a Knative component is not installed on the cluster, with a link to its
 * install guide.
 *
 * @param props - Whether the install check is still running, and which component is missing.
 * @returns A spinner while the check runs, otherwise the message.
 */
export function NotInstalledBanner({
  isLoading = false,
  component = 'serving',
}: NotInstalledBannerProps) {
  const { productName, installUrl } = COMPONENT_BANNER[component];

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
        <Typography variant="h5">
          {productName} was not detected on your cluster. If you haven't already, please install it.
        </Typography>
        <Typography>
          Learn how to{' '}
          <MuiLink href={installUrl} target="_blank" rel="noopener noreferrer">
            install
          </MuiLink>{' '}
          {productName}
        </Typography>
      </Box>
    </Box>
  );
}
