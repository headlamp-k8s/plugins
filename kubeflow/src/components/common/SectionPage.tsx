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
import { useApiGroupInstalled } from '../../hooks/useKubeflowCheck';

interface Props {
  title: string;
  apiPath: string;
  children: React.ReactNode;
}

export function SectionPage({ title, apiPath, children }: Props) {
  const normalizedPath = React.useMemo(() => {
    try {
      if (!apiPath.startsWith('/')) return apiPath;
      const segments = apiPath.split('/').filter(Boolean);
      if (segments.length === 0) return apiPath;
      if (segments[0] === 'apis' && segments.length >= 3) {
        return `/apis/${segments[1]}/${segments[2]}`;
      }
      if (segments[0] === 'api' && segments.length >= 2) {
        return `/api/${segments[1]}`;
      }
      return apiPath;
    } catch {
      return apiPath;
    }
  }, [apiPath]);

  const { isInstalled, isCheckLoading } = useApiGroupInstalled(normalizedPath);

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
