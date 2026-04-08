import { Icon } from '@iconify/react';
import { LightTooltip, StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';
import React from 'react';
import { getProfileStatus } from './notebookUtils';

interface ProfileStatusBadgeProps {
  jsonData: any;
}

export function ProfileStatusBadge({ jsonData }: ProfileStatusBadgeProps) {
  const { label, status, icon, reason } = getProfileStatus(jsonData);
  const statusEl = (
    <StatusLabel status={status}>
      {label}
      <Icon aria-hidden icon={icon} width="1.2rem" height="1.2rem" />
    </StatusLabel>
  );

  if (reason) {
    return (
      <LightTooltip title={reason} interactive>
        <Box display="inline">{statusEl}</Box>
      </LightTooltip>
    );
  }

  return statusEl;
}
