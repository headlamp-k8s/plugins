import { Icon } from '@iconify/react';
import { Box, IconButton, Typography } from '@mui/material';
import { useTheme } from '@mui/material';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onDelete: () => void;
}

export function BulkActionsToolbar({ selectedCount, onDelete }: BulkActionsToolbarProps) {
  if (selectedCount === 0) {
    return null;
  }
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        backgroundColor: theme.palette.action.hover,
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
