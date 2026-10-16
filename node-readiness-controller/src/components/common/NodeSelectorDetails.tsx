import { Box, Chip } from '@mui/material';
import React from 'react';
import type { LabelSelectorRequirement, NodeSelector } from '../../resources';

export interface NodeSelectorDetailsProps {
  selector?: NodeSelector;
}

export default function NodeSelectorDetails({ selector }: NodeSelectorDetailsProps) {
  const hasLabels = selector?.matchLabels && Object.keys(selector.matchLabels).length > 0;
  const hasExprs = selector?.matchExpressions && selector.matchExpressions.length > 0;

  if (!hasLabels && !hasExprs) {
    return <>None (Matches all nodes)</>;
  }

  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
      {selector?.matchLabels &&
        Object.entries(selector.matchLabels).map(([key, val]) => (
          <Chip key={key} label={`${key}: ${val}`} size="small" variant="outlined" />
        ))}
      {selector?.matchExpressions?.map((expression: LabelSelectorRequirement, index: number) => (
        <Chip
          key={`${expression.key}-${index}`}
          label={`${expression.key} ${expression.operator}${
            expression.values?.length ? ` [${expression.values.join(', ')}]` : ''
          }`}
          size="small"
          variant="outlined"
        />
      ))}
    </Box>
  );
}
