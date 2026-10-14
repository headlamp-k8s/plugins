import { Box, Tooltip, Typography } from '@mui/material';
import React from 'react';
import type { NodeSelector } from '../../resources';

export interface NodeSelectorSummaryProps {
  selector?: NodeSelector;
}

export function getNodeSelectorSummaryText(selector?: NodeSelector): string {
  const labels = selector?.matchLabels;
  const exprs = selector?.matchExpressions;
  const numLabels = labels ? Object.keys(labels).length : 0;
  const numExprs = exprs ? exprs.length : 0;

  if (numLabels === 0 && numExprs === 0) {
    return 'All Nodes';
  }

  if (numLabels === 1 && numExprs === 0) {
    const key = Object.keys(labels!)[0];
    return `${key}=${labels![key]}`;
  }

  const parts: string[] = [];
  if (numLabels > 0) parts.push(`${numLabels} Lbls`);
  if (numExprs > 0) parts.push(`${numExprs} Exprs`);
  return parts.join(', ');
}

export default function NodeSelectorSummary({ selector }: NodeSelectorSummaryProps) {
  const labels = selector?.matchLabels;
  const exprs = selector?.matchExpressions;

  if (!labels && !exprs) {
    return (
      <Box sx={{ minWidth: '70px' }}>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          All Nodes
        </Typography>
      </Box>
    );
  }

  const displayText = getNodeSelectorSummaryText(selector);
  const tooltipText = JSON.stringify(selector || {}, null, 2);

  return (
    <Box sx={{ minWidth: '70px', maxWidth: '160px' }}>
      <Tooltip title={<pre style={{ margin: 0, fontSize: '0.75rem' }}>{tooltipText}</pre>}>
        <Typography
          tabIndex={0}
          variant="body2"
          sx={{
            cursor: 'help',
            textDecoration: 'underline dotted',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
          }}
        >
          {displayText}
        </Typography>
      </Tooltip>
    </Box>
  );
}
