import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import type { DeploymentStatus } from '../types/pipecd';

const STATUS_LEVELS: Record<DeploymentStatus, 'success' | 'warning' | 'error' | ''> = {
  DEPLOYMENT_PENDING: '',
  DEPLOYMENT_PLANNED: '',
  DEPLOYMENT_RUNNING: 'warning',
  DEPLOYMENT_ROLLING_BACK: 'warning',
  DEPLOYMENT_SUCCESS: 'success',
  DEPLOYMENT_FAILURE: 'error',
  DEPLOYMENT_CANCELLED: '',
};

interface DeploymentStatusLabelProps {
  status: DeploymentStatus | undefined;
}

export function DeploymentStatusLabel({ status }: DeploymentStatusLabelProps): JSX.Element {
  const { t } = useTranslation();
  const labels: Record<DeploymentStatus, string> = {
    DEPLOYMENT_PENDING: t('Pending'),
    DEPLOYMENT_PLANNED: t('Planned'),
    DEPLOYMENT_RUNNING: t('Running'),
    DEPLOYMENT_ROLLING_BACK: t('Rolling Back'),
    DEPLOYMENT_SUCCESS: t('Success'),
    DEPLOYMENT_FAILURE: t('Failure'),
    DEPLOYMENT_CANCELLED: t('Cancelled'),
  };
  const resolved: DeploymentStatus = status ?? 'DEPLOYMENT_PENDING';
  return <StatusLabel status={STATUS_LEVELS[resolved]}>{labels[resolved]}</StatusLabel>;
}
