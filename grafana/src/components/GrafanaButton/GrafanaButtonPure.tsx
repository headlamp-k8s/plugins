import { Icon } from '@iconify/react';
import { IconButton, Tooltip } from '@mui/material';
import React from 'react';

export interface GrafanaButtonPureProps {
  dashboard: string;
  grafanaUrl: string;
}

export function GrafanaButtonPure({ dashboard, grafanaUrl }: GrafanaButtonPureProps) {
  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();

    let redirectUrl = dashboard;
    if (grafanaUrl && !dashboard.startsWith('http')) {
      const base = grafanaUrl.endsWith('/') ? grafanaUrl : `${grafanaUrl}/`;
      const relative = dashboard.startsWith('/') ? dashboard.slice(1) : dashboard;
      redirectUrl = new URL(relative, base).toString();
    }

    window.open(redirectUrl, '_blank');
  };

  if (!grafanaUrl && !dashboard.startsWith('http')) {
    return null;
  }

  return (
    <Tooltip title="View in Grafana">
      <IconButton
        onClick={handleClick}
        aria-label="View in Grafana"
        aria-haspopup="true"
        size="large"
      >
        <Icon icon="simple-icons:grafana" width="20" />
      </IconButton>
    </Tooltip>
  );
}
