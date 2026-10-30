import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import React from 'react';

export default function CanaryStatus({ status }) {
  const { t } = useTranslation();

  const phaseLabels: Record<string, string> = {
    Initializing: t('Initializing'),
    Initialized: t('Initialized'),
    Waiting: t('Waiting'),
    WaitingPromotion: t('Waiting Promotion'),
    Progressing: t('Progressing'),
    Promoting: t('Promoting'),
    Finalising: t('Finalising'),
    Succeeded: t('Succeeded'),
    Failed: t('Failed'),
    Terminating: t('Terminating'),
    Terminated: t('Terminated'),
  };

  let type;
  switch (status) {
    case 'Progressing':
      type = 'warning';
      break;
    case 'Succeeded':
      type = 'success';
      break;
    case 'Failed':
      type = 'error';
      break;
    default:
      type = '';
  }
  return <StatusLabel status={type}>{phaseLabels[status] ?? status}</StatusLabel>;
}
