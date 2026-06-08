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
      try {
        // Use URL constructor with the full dashboard path (including query params)
        // The second arg (base) ensures proper resolution
        const url = new URL(dashboard, grafanaUrl);
        redirectUrl = url.toString();
      } catch (e) {
        // Fallback to string concatenation if URL parsing fails
        const base = grafanaUrl.endsWith('/') ? grafanaUrl : `${grafanaUrl}/`;
        const relative = dashboard.startsWith('/') ? dashboard.slice(1) : dashboard;
        redirectUrl = `${base}${relative}`;
      }
    }

    window.open(redirectUrl, '_blank', 'noopener,noreferrer');
  };

  if (!grafanaUrl && !dashboard.startsWith('http')) {
    return null;
  }

  return (
    <Tooltip title="View in Grafana (opens in new tab)">
      <IconButton
        onClick={handleClick}
        aria-label="View in Grafana (opens in new tab)"
        size="large"
      >
        <Icon icon="simple-icons:grafana" width="20" />
      </IconButton>
    </Tooltip>
  );
}
