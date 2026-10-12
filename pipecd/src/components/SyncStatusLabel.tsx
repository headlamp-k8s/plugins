import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import type { SyncStatus } from '../types/pipecd';

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
  const { t } = useTranslation();
  const labels: Record<SyncStatus, string> = {
    UNKNOWN: t('Unknown'),
    SYNCED: t('Synced'),
    DEPLOYING: t('Deploying'),
    OUT_OF_SYNC: t('Out of Sync'),
    INVALID_CONFIG: t('Invalid Config'),
  };
  const resolved: SyncStatus = status ?? 'UNKNOWN';
  return <StatusLabel status={STATUS_LEVELS[resolved]}>{labels[resolved]}</StatusLabel>;
}
