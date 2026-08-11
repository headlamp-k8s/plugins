import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { purple } from '@mui/material/colors';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React from 'react';
import { ResourceQuotaCalculation } from '../../utils/resourceQuota';

interface ClusterQueueQuotaBarProps {
  calculation: ResourceQuotaCalculation;
}

export default function ClusterQueueQuotaBar({ calculation }: ClusterQueueQuotaBarProps) {
  const {
    resourceName,
    percentage,
    ratio,
    isBorrowingOnly,
    isOverNominal,
    reservedDisplay,
    nominalDisplay,
    borrowedDisplay,
    nominalQuotaValue,
  } = calculation;

  if (nominalQuotaValue === 0 && !isBorrowingOnly) {
    return <Typography variant="body2" color="text.secondary">-</Typography>;
  }

  if (isBorrowingOnly) {
    return (
      <Chip
        label="Borrowing-only"
        size="small"
        variant="outlined"
        sx={{
          height: 22,
          fontSize: '0.75rem',
          borderColor: theme => (theme.palette.mode === 'dark' ? purple[300] : purple[700]),
          color: theme => (theme.palette.mode === 'dark' ? purple[300] : purple[700]),
        }}
      />
    );
  }

  if (percentage === null || ratio === null) {
    return <Typography variant="body2" color="text.secondary">-</Typography>;
  }

  const barValue = Math.min(percentage, 100);

  // Determine progress bar color matching Headlamp's semantic thresholds
  let color: 'success' | 'warning' | 'error' | 'secondary' = 'success';
  if (isOverNominal) {
    color = 'secondary';
  } else if (ratio >= 0.9) {
    color = 'error';
  } else if (ratio >= 0.8) {
    color = 'warning';
  }

  const ariaValueText = isOverNominal
    ? `${percentage}% (${borrowedDisplay} borrowed beyond nominal quota)`
    : `${percentage}%`;

  const tooltipTitle = `Reserved: ${reservedDisplay} / Nominal: ${nominalDisplay}${
    isOverNominal ? ` (${borrowedDisplay} borrowed)` : ''
  }`;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 140 }}>
      <Box sx={{ flex: 1, mr: 1 }}>
        <Tooltip title={tooltipTitle} placement="top">
          <LinearProgress
            role="progressbar"
            aria-label={`Kueue ${resourceName} Quota Reserved`}
            aria-valuenow={barValue}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={ariaValueText}
            variant="determinate"
            value={barValue}
            color={color}
            sx={{
              height: 8,
              borderRadius: 4,
              '& .MuiLinearProgress-bar': {
                backgroundColor: theme =>
                  isOverNominal
                    ? (theme.palette.mode === 'dark' ? purple[300] : purple[700])
                    : ratio >= 0.9
                    ? theme.palette.error.main
                    : ratio >= 0.8
                    ? theme.palette.warning.main
                    : (theme.palette.home?.status?.success ?? theme.palette.success.dark),
              },
            }}
          />
        </Tooltip>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40, fontWeight: isOverNominal ? 600 : 400 }}>
        {percentage}%
      </Typography>
    </Box>
  );
}
