import { Dialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Button, DialogActions, DialogContent, InputLabel, MenuItem, Select } from '@mui/material';

/** A single entry in the release history, representing one deployed revision. */
interface Release {
  /** Helm revision number. */
  version: number;
  info: {
    /** ISO timestamp of when this revision was deployed. */
    last_deployed: string;
    description?: string;
  };
}

/** Helm history response containing all past revisions for a release. */
interface ReleaseHistory {
  releases: Release[];
}

/** Props for the rollback version selection dialog. */
interface RollbackDialogProps {
  open: boolean;
  /** Release history fetched from the Helm API; null while loading. */
  releaseHistory: ReleaseHistory | null;
  /** Currently selected revision to roll back to (as a string for the Select value). */
  revertVersion: string;
  onVersionChange: (version: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RollbackDialog({
  open,
  releaseHistory,
  revertVersion,
  onVersionChange,
  onConfirm,
  onCancel,
}: RollbackDialogProps) {
  return (
    <Dialog open={open} maxWidth="xs" onClose={onCancel} title="Rollback">
      <DialogContent
        sx={{
          width: { xs: '100%', sm: '400px' },
          minHeight: '100px',
        }}
      >
        <InputLabel id="revert">Select a version</InputLabel>
        <Select
          value={revertVersion}
          onChange={event => onVersionChange(event.target.value as string)}
          id="revert"
          labelId="revert"
          label="Select a version"
          fullWidth
        >
          {releaseHistory?.releases?.map((release: Release) => {
            return (
              <MenuItem key={release.version} value={release.version.toString()}>
                {release.version} - {release.info.description || 'N/A'} (
                {new Date(release.info.last_deployed).toLocaleString()})
              </MenuItem>
            );
          })}
        </Select>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onConfirm}>
          Revert
        </Button>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
