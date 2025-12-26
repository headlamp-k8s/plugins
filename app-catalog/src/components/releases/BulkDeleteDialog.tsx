import { Dialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Button, DialogActions, DialogContent, DialogContentText } from '@mui/material';

interface BulkDeleteDialogProps {
  open: boolean;
  count: number;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function BulkDeleteDialog({
  open,
  count,
  isDeleting,
  onClose,
  onConfirm,
}: BulkDeleteDialogProps) {
  return (
    <Dialog open={open} maxWidth="sm" onClose={onClose} title="Uninstall Multiple Apps">
      <DialogContent>
        <DialogContentText>
          Are you sure you want to uninstall {count} {count === 1 ? 'release' : 'releases'}?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{isDeleting ? 'Close' : 'No'}</Button>
        <Button disabled={isDeleting} onClick={onConfirm} color="error">
          {isDeleting ? 'Deleting...' : 'Yes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
