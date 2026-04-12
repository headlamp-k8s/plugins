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

import { Icon } from '@iconify/react';
import { LightTooltip, StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';
import { getPipelineResourceStatus, PipelineStatusResource } from './pipelineUtils';

interface PipelineStatusBadgeProps {
  resource: PipelineStatusResource | null | undefined;
}

/**
 * Renders a status badge for Pipeline and PipelineVersion resources.
 */
export function PipelineStatusBadge({ resource }: PipelineStatusBadgeProps) {
  const { label, status, icon, reason } = getPipelineResourceStatus(resource);
  const statusElement = (
    <StatusLabel status={status}>
      {label}
      <Icon aria-hidden icon={icon} width="1.2rem" height="1.2rem" />
    </StatusLabel>
  );

  if (reason) {
    return (
      <LightTooltip title={reason} interactive>
        <Box display="inline">{statusElement}</Box>
      </LightTooltip>
    );
  }

  return statusElement;
}
