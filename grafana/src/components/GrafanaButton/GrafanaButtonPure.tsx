import { Icon } from '@iconify/react';
import { IconButton, Tooltip } from '@mui/material';
import React from 'react';

export interface GrafanaButtonPureProps {
  dashboard: string;
  grafanaUrl: string;
}

export function GrafanaButtonPure({ dashboard, grafanaUrl }: GrafanaButtonPureProps) {
  const resolvedUrl = React.useMemo(() => {
    try {
      if (!grafanaUrl) {
        return null;
      }

      const base = new URL(grafanaUrl);
             let url: URL;
       // Keep absolute URLs and protocol-relative URLs unchanged.
       // /^[a-zA-Z][a-zA-Z\d+.-]*:/ matches absolute URLs
       // dashboard.startsWith('//') matches protocol-relative URLs
       if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(dashboard) || dashboard.startsWith('//')) {
         url = new URL(dashboard, base);
       } else {
       
         const baseWithSlash = new URL(base.toString());
         if (!baseWithSlash.pathname.endsWith('/')) {
           baseWithSlash.pathname = baseWithSlash.pathname + '/';
         }
         const relativeDashboard = dashboard.startsWith('/') ? dashboard.slice(1) : dashboard;
         url = new URL(relativeDashboard, baseWithSlash);
       }

      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return null;
      }

      // Only allow navigation within the configured Grafana instance.
      if (url.origin !== base.origin) {
        return null;
      }

      return url.toString();
    } catch (e) {
      return null;
    }
  }, [dashboard, grafanaUrl]);

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (!resolvedUrl) {
      return;
    }
    window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
  };

  if (!resolvedUrl) {
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
