import { Dialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Button,
  DialogActions,
  DialogContent,
  InputLabel,
  MenuItem,
  Select,
  useTheme,
} from '@mui/material';

interface Release {
  version: number;
  info: {
    last_deployed: string;
  };
}

interface ReleaseHistory {
  releases: Release[];
}

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
  const theme = useTheme();

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
                {release.version} - {new Date(release.info.last_deployed).toLocaleString()}
              </MenuItem>
            );
          })}
        </Select>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onConfirm}
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          }}
        >
          Revert
        </Button>
        <Button
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          }}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
