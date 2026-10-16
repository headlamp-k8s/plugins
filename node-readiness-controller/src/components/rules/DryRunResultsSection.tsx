import { Box, Chip, Typography } from '@mui/material';
import React from 'react';
import type { DryRunResults } from '../../resources';

export interface DryRunResultsSectionProps {
  results?: DryRunResults;
  failed?: number;
}

export default function DryRunResultsSection({ results, failed = 0 }: DryRunResultsSectionProps) {
  if (!results) {
    return <>Pending simulation</>;
  }

  return (
    <Box>
      {results.summary && (
        <Typography variant="body2" gutterBottom>
          {results.summary}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
        <Chip
          label={`Affected Nodes: ${results.affectedNodes || 0}`}
          size="small"
          color="primary"
        />
        <Chip label={`Taints To Add: ${results.taintsToAdd || 0}`} size="small" color="warning" />
        <Chip
          label={`Taints To Remove: ${results.taintsToRemove || 0}`}
          size="small"
          color="success"
        />
        <Chip
          label={`Risky Operations: ${results.riskyOperations || 0}`}
          size="small"
          color="error"
        />
        {failed > 0 && <Chip label={`Evaluation Errors: ${failed}`} size="small" color="error" />}
      </Box>
    </Box>
  );
}
