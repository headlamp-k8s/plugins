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

import { LightTooltip, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box } from '@mui/material';

interface ReadyStatusLabelProps {
  status: 'True' | 'False' | 'Unknown';
  reason?: string;
  message?: string;
  isReadyType?: boolean;
}

export function ReadyStatusLabel({
  status,
  reason,
  message,
  isReadyType = true,
}: ReadyStatusLabelProps) {
  let headlampStatus: 'success' | 'error' | 'warning' | '' = '';
  let labelText = 'Unknown';

  if (status === 'True') {
    headlampStatus = 'success';
    labelText = isReadyType ? 'Ready' : 'True';
  } else if (status === 'False') {
    headlampStatus = 'error';
    labelText = isReadyType ? 'Not Ready' : 'False';
  } else {
    headlampStatus = 'warning';
  }

  const tooltipLines = [labelText];
  if (reason) tooltipLines.push(`Reason: ${reason}`);
  if (message) tooltipLines.push(`Message: ${message}`);

  return (
    <LightTooltip
      title={<span style={{ whiteSpace: 'pre-line' }}>{tooltipLines.join('\n')}</span>}
      interactive
    >
      <Box display="inline">
        <StatusLabel status={headlampStatus}>{labelText}</StatusLabel>
      </Box>
    </LightTooltip>
  );
}
