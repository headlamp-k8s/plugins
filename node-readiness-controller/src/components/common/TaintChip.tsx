import { Box, Tooltip, Typography } from '@mui/material';
import React from 'react';
import type { NodeReadinessTaint } from '../../resources';

export interface TaintChipProps {
  taint?: NodeReadinessTaint;
}

export function formatTaint(taint?: NodeReadinessTaint): string {
  if (!taint) return 'None';
  return taint.value
    ? `${taint.key}=${taint.value}:${taint.effect}`
    : `${taint.key}:${taint.effect}`;
}

export default function TaintChip({ taint }: TaintChipProps) {
  if (!taint) {
    return (
      <Typography variant="body2" color="text.secondary">
        None
      </Typography>
    );
  }

  const fullText = formatTaint(taint);

  return (
    <Box sx={{ minWidth: '100px' }}>
      <Tooltip title={fullText}>
        <Typography
          tabIndex={0}
          variant="body2"
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '120px',
          }}
        >
          {taint.key}
        </Typography>
      </Tooltip>
    </Box>
  );
}
