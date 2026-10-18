import { Box, Tooltip, Typography } from '@mui/material';
import React from 'react';
import type { NodeReadinessTaint } from '../../resources';

/**
 * Props for the TaintChip component.
 */
export interface TaintChipProps {
  /** The taint specification managed by the readiness rule. */
  taint?: NodeReadinessTaint;
}

/**
 * Formats a NodeReadinessTaint object into a canonical Kubernetes taint string ('key=value:effect' or 'key:effect').
 *
 * @param taint - The taint object to format.
 * @returns Formatted taint string, or 'None' if undefined.
 */
export function formatTaint(taint?: NodeReadinessTaint): string {
  if (!taint) return 'None';
  return taint.value
    ? `${taint.key}=${taint.value}:${taint.effect}`
    : `${taint.key}:${taint.effect}`;
}

/**
 * Renders a compact taint key chip with a hover tooltip displaying the complete taint definition.
 *
 * @param props - Component props containing the taint specification.
 * @returns Rendered JSX element with tooltip.
 */
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
