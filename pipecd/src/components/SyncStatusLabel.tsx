import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import type { SyncStatus } from '../types/pipecd';

const STATUS_LABELS: Record<SyncStatus, string> = {
  UNKNOWN: 'Unknown',
  SYNCED: 'Synced',
  DEPLOYING: 'Deploying',
  OUT_OF_SYNC: 'Out of Sync',
  INVALID_CONFIG: 'Invalid Config',
};

const STATUS_LEVELS: Record<SyncStatus, 'success' | 'warning' | 'error' | ''> = {
  UNKNOWN: '',
  SYNCED: 'success',
  DEPLOYING: 'warning',
  // PipeCD's console shows Out of Sync in red and Invalid Config in amber.
  OUT_OF_SYNC: 'error',
  INVALID_CONFIG: 'warning',
};

interface SyncStatusLabelProps {
  status: SyncStatus | undefined;
}

export function SyncStatusLabel({ status }: SyncStatusLabelProps): JSX.Element {
  const resolved: SyncStatus = status ?? 'UNKNOWN';
  return <StatusLabel status={STATUS_LEVELS[resolved]}>{STATUS_LABELS[resolved]}</StatusLabel>;
}
