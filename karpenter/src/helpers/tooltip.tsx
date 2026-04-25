import { getPercentStr, getResourceStr } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Typography } from '@mui/material';

export const CPUtooltip = (used: number, limit: number) => {
  const percent = limit > 0 ? getPercentStr(used, limit) : 'No limit set';

  return (
    <Typography>
      {used} {limit > 0 ? `of ${limit} (${percent})` : 'No limit set'}
    </Typography>
  );
};

export const Memorytooltip = (used: number, limit: number) => {
  const percentage = limit > 0 ? getPercentStr(used, limit) : 'No limit set';

  return (
    <Typography>
      {getResourceStr(used, 'memory')}{' '}
      {limit > 0 ? `of ${getResourceStr(limit, 'memory')} (${percentage})` : '(No memory limit)'}
    </Typography>
  );
};
