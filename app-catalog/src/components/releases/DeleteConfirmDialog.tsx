import { Dialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Button, DialogActions, DialogContent, DialogContentText } from '@mui/material';

/** Props for the delete confirmation dialog shown before uninstalling a release. */
interface DeleteConfirmDialogProps {
  open: boolean;
  /** True while the uninstall request is in progress; disables confirm and changes button labels. */
  isDeleting: boolean;
  /** Name of the release to uninstall, shown in the confirmation message. */
  releaseName?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  open,
  isDeleting,
  releaseName,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} maxWidth="sm" onClose={onClose} title="Uninstall App">
      <DialogContent>
        <DialogContentText>
          Are you sure you want to uninstall this release{releaseName ? ` "${releaseName}"` : ''}?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{isDeleting ? 'Close' : 'No'}</Button>
        <Button disabled={isDeleting} onClick={onConfirm}>
          {isDeleting ? 'Deleting' : 'Yes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
