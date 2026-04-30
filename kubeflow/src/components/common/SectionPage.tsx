/**
 * Copyright 2025 The Headlamp Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import React from 'react';
import { normalizeApiPathForDiscovery, useApiGroupInstalled } from '../../hooks/useKubeflowCheck';

interface Props {
  title: string;
  apiPath: string;
  children: React.ReactNode;
}

export function SectionPage({ title, apiPath, children }: Props) {
  const normalizedPath = React.useMemo(() => normalizeApiPathForDiscovery(apiPath), [apiPath]);

  const { isInstalled: hookIsInstalled, isCheckLoading: hookIsCheckLoading } =
    useApiGroupInstalled(normalizedPath);

  const isStorybook =
    typeof window !== 'undefined' && (window as any).HEADLAMP_KUBEFLOW_STORYBOOK_MOCK;
  const isInstalled = isStorybook ? true : hookIsInstalled;
  const isCheckLoading = isStorybook ? false : hookIsCheckLoading;

  React.useEffect(() => {
    if (isStorybook) {
      console.log(`[SectionPage] Storybook mock active for ${title} (${apiPath})`);
    }
  }, [title, apiPath, isStorybook]);

  if (isCheckLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Checking cluster capabilities for {title}...</Typography>
      </Box>
    );
  }

  if (!isInstalled) {
    return (
      <Box sx={{ padding: '24px 16px', pt: '32px' }}>
        <Typography variant="h1" sx={{ fontSize: '1.87rem', fontWeight: 700, mb: 1 }}>
          {title}
        </Typography>
        <Alert severity="warning" sx={{ mt: 2, borderRadius: '4px' }}>
          Required Kubeflow API {apiPath} is not detected on this cluster.
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
}
