import React from 'react';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';

interface VeleroStatusBadgeProps {
  status: string;
}

export const VeleroStatusBadge: React.FC<VeleroStatusBadgeProps> = ({ status }) => {
  const statusLower = (status || '').toLowerCase();

  let statusType: 'success' | 'warning' | 'error' | 'info' | undefined;

  switch (statusLower) {
    case 'completed':
    case 'available':
    case 'enabled':
      statusType = 'success';
      break;
    case 'inprogress':
    case 'new':
    case 'deleting':
      statusType = 'info';
      break;
    case 'partiallyfailed':
      statusType = 'warning';
      break;
    case 'failed':
    case 'unavailable':
    case 'failedvalidation':
      statusType = 'error';
      break;
    default:
      statusType = undefined;
      break;
  }

  return <StatusLabel status={statusType}>{status}</StatusLabel>;
};
