import { Box, Chip } from '@mui/material';
import React from 'react';
import type { LabelSelectorRequirement, NodeSelector } from '../../resources';

/**
 * Props for the NodeSelectorDetails component.
 */
export interface NodeSelectorDetailsProps {
  /** The target node selector specification to display in detail. */
  selector?: NodeSelector;
}

/**
 * Displays an expanded visual breakdown of node selector requirements,
 * including individual matchLabels chips and matchExpressions chips.
 *
 * @param props - Component props containing the node selector.
 * @returns Rendered JSX chip list or fallback indicator when targeting all nodes.
 */
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
