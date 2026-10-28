import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box } from '@mui/material';
import React from 'react';

/**
 * Props for the NodeStatusChips component.
 */
export interface NodeStatusChipsProps {
  /** Total number of worker nodes targeted by the rule. */
  targeted: number;
  /** Number of nodes where all readiness conditions are satisfied (taint absent). */
  satisfied: number | 'N/A';
  /** Number of nodes failing one or more conditions (taint present). */
  unsatisfied: number | 'N/A';
  /** Number of nodes that experienced evaluation errors. */
  failed: number;
}

/**
 * Renders a row of semantic Headlamp StatusLabel chips displaying targeted,
 * satisfied (taint absent), unsatisfied (taint present), and failed node counts.
 *
 * @param props - Component props containing node evaluation counts.
 * @returns Rendered JSX chip row.
 */
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
      <StatusLabel
        status={Number(unsatisfied) > 0 ? 'warning' : ''}
        sx={{ fontSize: '0.8125rem', py: 0.25 }}
      >
        Taint Present: {unsatisfied}
      </StatusLabel>
      <StatusLabel status={failed > 0 ? 'error' : ''} sx={{ fontSize: '0.8125rem', py: 0.25 }}>
        Evaluation Errors: {failed}
      </StatusLabel>
    </Box>
  );
}
