import { Dialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Button, DialogActions, DialogContent, InputLabel, MenuItem, Select } from '@mui/material';

interface Release {
  version: number;
  info: {
    last_deployed: string;
  };
}

interface ReleaseHistory {
  releases: Release[];
}

const BUTTON_STYLES = {
  backgroundColor: '#000',
  color: 'white',
  textTransform: 'none' as const,
};

interface RollbackDialogProps {
  open: boolean;
  releaseHistory: ReleaseHistory | null;
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
          width: '400px',
          height: '100px',
        }}
      >
        <InputLabel id="revert">Select a version</InputLabel>
        <Select
          value={revertVersion}
          onChange={event => onVersionChange(event.target.value as string)}
          id="revert"
          fullWidth
        >
          {releaseHistory &&
            releaseHistory.releases.map((release: Release) => {
              return (
                <MenuItem key={release.version} value={release.version.toString()}>
                  {release.version} - {new Date(release.info.last_deployed).toLocaleString()}
                </MenuItem>
              );
            })}
        </Select>
      </DialogContent>
      <DialogActions>
        <Button onClick={onConfirm} sx={BUTTON_STYLES}>
          Revert
        </Button>
        <Button sx={BUTTON_STYLES} onClick={onCancel}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
