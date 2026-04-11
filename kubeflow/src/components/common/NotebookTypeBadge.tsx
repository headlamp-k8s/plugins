import { Icon } from '@iconify/react';
import Box from '@mui/material/Box';
import React from 'react';
import { getNotebookType } from './notebookUtils';

interface NotebookTypeBadgeProps {
  image: string;
}

export function NotebookTypeBadge({ image }: NotebookTypeBadgeProps) {
  const notebookType = getNotebookType(image);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Icon
        icon={notebookType.icon}
        width="18"
        height="18"
        style={{ color: notebookType.color }}
        aria-hidden
      />
      {notebookType.label}
    </Box>
  );
}
