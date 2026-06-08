import { Icon } from '@iconify/react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import React, { useCallback, useState } from 'react';
import semver from 'semver';

const ICON_SPACING = { marginRight: 8 };

/** Minimal release shape needed by the actions menu. */
interface Release {
  name: string;
  namespace: string;
  /** Current revision number; rollback is disabled when version <= 1. */
  version: number;
  /** Chart metadata; the current app version gates the Upgrade action. */
  chart?: {
    metadata?: {
      appVersion?: string;
    };
  };
}

/**
 * Determines whether an upgrade is available for a release.
 *
 * Compares the release's current app version against the latest known app
 * version (from Artifact Hub). An upgrade is available only when both versions
 * are known and parseable and the latest is strictly greater than the current.
 * When either version is unknown or unparseable we return `true` (upgrade
 * allowed) rather than blocking a potentially valid action.
 *
 * @param current - the release's current app version
 * @param latest - the latest known app version for the chart
 * @returns whether an upgrade is available
 */
function isUpgradeAvailable(current?: string, latest?: string): boolean {
  const latestSemver = latest && latest !== '—' ? semver.coerce(latest) : null;
  const currentSemver = current && current !== '—' ? semver.coerce(current) : null;

  // If we can't reliably compare, don't block the upgrade action.
  if (!latestSemver || !currentSemver) {
    return true;
  }

  return semver.gt(latestSemver, currentSemver);
}

/**
 * Props for the three-dot actions menu attached to each release row.
 *
 * Generic over the concrete release type so callers can pass their own richer
 * `Release` (e.g. one that also carries `info`) without a type clash on the
 * action callbacks. The menu derives the disabled state of each action from the
 * release itself, plus the externally-fetched `latestAppVersion` it can't know
 * on its own.
 */
interface ReleaseActionsMenuProps<T extends Release> {
  release: T;
  /** Latest app version known for the chart (from Artifact Hub); gates Upgrade. */
  latestAppVersion?: string;
  onUpgrade: (release: T) => void;
  onRollback: (release: T) => void;
  onDelete: (release: T) => void;
}

export function ReleaseActionsMenu<T extends Release>({
  release,
  latestAppVersion,
  onUpgrade,
  onRollback,
  onDelete,
}: ReleaseActionsMenuProps<T>) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  // Upgrade is only possible when a newer chart version exists.
  const upgradeDisabled = !isUpgradeAvailable(
    release.chart?.metadata?.appVersion,
    latestAppVersion
  );
  // Rollback needs a previous revision to revert to; revision 1 is the first.
  const rollbackDisabled = release.version <= 1;

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
      <IconButton onClick={handleMenuClick} size="small" aria-label="Release actions">
        <Icon icon="mdi:dots-vertical" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleUpgrade} disabled={upgradeDisabled}>
          <Icon icon="mdi:arrow-up-bold" style={ICON_SPACING} />
          Upgrade
        </MenuItem>
        <MenuItem onClick={handleRollback} disabled={rollbackDisabled}>
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
