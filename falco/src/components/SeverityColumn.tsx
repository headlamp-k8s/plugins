import Box from '@mui/material/Box';
import React from 'react';
import { FalcoEvent } from '../types/FalcoEvent';
import { getSeverityColor } from '../utils/falcoEventUtils';

interface SeverityColumnProps {
  ev: FalcoEvent;
}

/**
 * A component to display severity with color.
 */
const SeverityColumn: React.FC<SeverityColumnProps> = ({ ev }) => {
  const sev = ev.priority || 'N/A';
  const color = getSeverityColor(sev);

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 1.5,
        py: 0.5,
        borderRadius: 2,
        fontWeight: 600,
        color: '#fff',
        backgroundColor: color,
        fontSize: '0.85em',
        textTransform: 'capitalize',
        minWidth: 60,
        textAlign: 'center',
      }}
    >
      {sev}
    </Box>
  );
};

export default SeverityColumn;
