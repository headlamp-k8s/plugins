/**
 * Copyright 2026 The Headlamp Authors.
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

import { Icon } from '@iconify/react';
import {
  LightTooltip,
  StatusLabel,
  StatusLabelProps,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';

/**
 * Shared status metadata rendered by Kubeflow badges.
 */
export interface KubeflowStatusBadgeInfo {
  label: string;
  status: StatusLabelProps['status'];
  icon?: string;
  reason?: string | null;
}

interface KubeflowStatusBadgeProps {
  statusInfo: KubeflowStatusBadgeInfo;
}

function getDefaultStatusIcon(status: StatusLabelProps['status']): string {
  if (status === 'error') {
    return 'mdi:alert-circle';
  }
  if (status === 'success') {
    return 'mdi:check-circle';
  }
  return 'mdi:clock-outline';
}

/**
 * Renders a Headlamp-style status chip with a consistent icon and optional tooltip.
 */
export function KubeflowStatusBadge({ statusInfo }: KubeflowStatusBadgeProps) {
  const icon = statusInfo.icon ?? getDefaultStatusIcon(statusInfo.status);
  const badge = (
    <StatusLabel status={statusInfo.status}>
      {statusInfo.label}
      <Icon aria-hidden icon={icon} width="1.2rem" height="1.2rem" />
    </StatusLabel>
  );

  if (statusInfo.reason) {
    return (
      <LightTooltip title={statusInfo.reason} interactive>
        <Box display="inline">{badge}</Box>
      </LightTooltip>
    );
  }

  return badge;
}
