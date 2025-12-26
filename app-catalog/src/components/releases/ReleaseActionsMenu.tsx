import { Icon } from '@iconify/react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import React, { useCallback, useState } from 'react';

const ICON_SPACING = { marginRight: 8 };

interface Release {
  name: string;
  namespace: string;
  version: number;
}

interface ReleaseActionsMenuProps {
  release: Release;
  onUpgrade: (release: Release) => void;
  onRollback: (release: Release) => void;
  onDelete: (release: Release) => void;
}

export function ReleaseActionsMenu({
  release,
  onUpgrade,
  onRollback,
  onDelete,
}: ReleaseActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleUpgrade = useCallback(() => {
    onUpgrade(release);
    handleMenuClose();
  }, [release, onUpgrade, handleMenuClose]);

  const handleRollback = useCallback(() => {
    onRollback(release);
    handleMenuClose();
  }, [release, onRollback, handleMenuClose]);

  const handleDelete = useCallback(() => {
    onDelete(release);
    handleMenuClose();
  }, [release, onDelete, handleMenuClose]);

  return (
    <>
      <IconButton onClick={handleMenuClick} size="small">
        <Icon icon="mdi:dots-vertical" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleUpgrade}>
          <Icon icon="mdi:arrow-up-bold" style={ICON_SPACING} />
          Upgrade
        </MenuItem>
        <MenuItem onClick={handleRollback} disabled={release.version === 1}>
          <Icon icon="mdi:undo" style={ICON_SPACING} />
          Rollback
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <Icon icon="mdi:delete" style={ICON_SPACING} />
          Delete
        </MenuItem>
      </Menu>
    </>
  );
}
