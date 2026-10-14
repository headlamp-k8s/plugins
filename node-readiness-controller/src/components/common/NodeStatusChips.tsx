import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box } from '@mui/material';
import React from 'react';

export interface NodeStatusChipsProps {
  targeted: number;
  satisfied: number | 'N/A';
  unsatisfied: number | 'N/A';
  failed: number;
}

export default function NodeStatusChips({
  targeted,
  satisfied,
  unsatisfied,
  failed,
}: NodeStatusChipsProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
      <StatusLabel status="" sx={{ fontSize: '0.8125rem', py: 0.25 }}>
        Targeted: {targeted}
      </StatusLabel>
      <StatusLabel status="success" sx={{ fontSize: '0.8125rem', py: 0.25 }}>
        Taint Absent: {satisfied}
      </StatusLabel>
      <StatusLabel status="warning" sx={{ fontSize: '0.8125rem', py: 0.25 }}>
        Taint Present: {unsatisfied}
      </StatusLabel>
      <StatusLabel status="error" sx={{ fontSize: '0.8125rem', py: 0.25 }}>
        Evaluation Errors: {failed}
      </StatusLabel>
    </Box>
  );
}
