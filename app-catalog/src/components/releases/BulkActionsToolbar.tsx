import { Icon } from '@iconify/react';
import { Box, IconButton, Typography } from '@mui/material';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onDelete: () => void;
}

export function BulkActionsToolbar({ selectedCount, onDelete }: BulkActionsToolbarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
        borderRadius: '4px',
        marginBottom: '16px',
      }}
    >
      <Typography variant="body2">
        {selectedCount} {selectedCount === 1 ? 'release selected' : 'releases selected'}
      </Typography>
      <IconButton
        onClick={onDelete}
        size="small"
        aria-label="Delete selected releases"
        color="error"
      >
        <Icon icon="mdi:delete" />
      </IconButton>
    </Box>
  );
}
