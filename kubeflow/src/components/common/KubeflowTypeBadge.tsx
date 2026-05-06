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
import Chip, { ChipProps } from '@mui/material/Chip';

/**
 * Shared type metadata rendered by Kubeflow type badges.
 */
export interface KubeflowTypeBadgeInfo {
  label: string;
  icon: string;
  color: ChipProps['color'];
}

interface KubeflowTypeBadgeProps {
  typeInfo: KubeflowTypeBadgeInfo;
}

/**
 * Renders a theme-aware type badge using standard MUI and Headlamp styling.
 */
export function KubeflowTypeBadge({ typeInfo }: KubeflowTypeBadgeProps) {
  return (
    <Chip
      color={typeInfo.color}
      icon={<Icon aria-hidden icon={typeInfo.icon} width="16" height="16" />}
      label={typeInfo.label}
      size="small"
      variant="outlined"
    />
  );
}
