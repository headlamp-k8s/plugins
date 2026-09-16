/*
 * Copyright 2026 The Kubernetes Authors
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
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import React from 'react';
import { describeMissingPermission, MissingPermission } from '../../utils/permissions';

interface PermissionDeniedProps {
  title: string;
  permission: MissingPermission;
}

/**
 * Empty state shown when the API server refuses a read because of RBAC.
 *
 * The rule the user is missing is spelled out verbatim so it can be pasted
 * into an RBAC policy or a request to a cluster admin, rather than leaving
 * them with a bare "forbidden".
 */
export function PermissionDenied({ title, permission }: PermissionDeniedProps) {
  const { t } = useTranslation();
  const rule = describeMissingPermission(permission);

  return (
    <SectionBox title={title}>
      <Alert severity="warning">
        <AlertTitle>{t('Insufficient permissions')}</AlertTitle>
        <Typography variant="body2">
          {t('Your account is not allowed to perform this action:')}
        </Typography>
        <Box
          component="code"
          sx={{
            display: 'block',
            mt: 1,
            p: 1,
            borderRadius: 1,
            bgcolor: 'action.hover',
            fontFamily: 'monospace',
            overflowWrap: 'anywhere',
          }}
        >
          {rule}
        </Box>
      </Alert>
    </SectionBox>
  );
}

interface LoadFailedProps {
  title: string;
  message: string;
}

/** Empty state for a read that failed for a reason other than permissions. */
export function LoadFailed({ title, message }: LoadFailedProps) {
  const { t } = useTranslation();

  return (
    <SectionBox title={title}>
      <Alert severity="error">
        <AlertTitle>{t('Could not load CloudNativePG resources')}</AlertTitle>
        <Typography variant="body2">{message}</Typography>
      </Alert>
    </SectionBox>
  );
}
