import { Icon } from '@iconify/react';
import { LightTooltip, StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';
import React from 'react';
import { getNotebookStatus } from './notebookUtils';

interface NotebookStatusBadgeProps {
  jsonData: any;
}

export function NotebookStatusBadge({ jsonData }: NotebookStatusBadgeProps) {
  const { label, status, icon, reason } = getNotebookStatus(jsonData);
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
