import { getPercentStr, getResourceStr } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Typography } from '@mui/material';
import type { TFunction } from 'i18next';

export const CPUtooltip = (used: number, limit: number, t: TFunction) => {
  const percent = limit > 0 ? getPercentStr(used, limit) : t('No limit set');

  return (
    <Typography>
      {used} {limit > 0 ? t('of {{limit}} ({{percent}})', { limit, percent }) : t('No limit set')}
    </Typography>
  );
};

export const Memorytooltip = (used: number, limit: number, t: TFunction) => {
  const percentage = limit > 0 ? getPercentStr(used, limit) : t('No limit set');

  return (
    <Typography>
      {getResourceStr(used, 'memory')}{' '}
      {limit > 0
        ? t('of {{limit}} ({{percentage}})', {
            limit: getResourceStr(limit, 'memory'),
            percentage,
          })
        : t('(No memory limit)')}
    </Typography>
  );
};
