import React from 'react';
import { Box, Typography, LinearProgress, Paper } from '@mui/material';

interface ResourceGaugeProps {
  resourceName: string;
  used: number;
  total: number;
  unit?: string;
}

export function ResourceUsageGauge({
  resourceName,
  used,
  total,
  unit = '',
}: ResourceGaugeProps) {
  const percentage = Math.min(Math.round((used / total) * 100), 100);

  const getColor = () => {
    if (percentage > 85) return 'error';
    if (percentage > 70) return 'warning';
    return 'primary';
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, my: 1, backgroundColor: '#fdfdfd' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="body2" fontWeight="bold">
          {resourceName.toUpperCase()}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {used} / {total} {unit} ({percentage}%)
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        color={getColor()}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Paper>
  );
}

export default ResourceUsageGauge;
