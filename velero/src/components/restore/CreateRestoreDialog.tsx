import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
} from '@mui/material';
import { VeleroRestore } from '../../resources/restore';

interface CreateRestoreDialogProps {
  open: boolean;
  onClose: () => void;
  defaultBackupName?: string;
  onSuccess?: () => void;
}

export const CreateRestoreDialog: React.FC<CreateRestoreDialogProps> = ({
  open,
  onClose,
  defaultBackupName = '',
  onSuccess,
}) => {
  const [restoreName, setRestoreName] = useState('');
  const [backupName, setBackupName] = useState(defaultBackupName);
  const [namespace, setNamespace] = useState('velero');
  const [restorePVs, setRestorePVs] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetBackup = backupName || defaultBackupName;

    if (!targetBackup.trim()) {
      setError('Backup name is required to perform a restore.');
      return;
    }

    setLoading(true);
    setError(null);

    const generatedName = restoreName.trim() || `${targetBackup.trim()}-restore-${Date.now()}`;

    const restorePayload = {
      apiVersion: 'velero.io/v1',
      kind: 'Restore',
      metadata: {
        name: generatedName,
        namespace: namespace.trim(),
      },
      spec: {
        backupName: targetBackup.trim(),
        restorePVs: restorePVs,
      },
    };

    try {
      await VeleroRestore.apiEndpoint.post(restorePayload);
      setRestoreName('');
      setBackupName('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to trigger restore.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Trigger Velero Restore</DialogTitle>
        <DialogContent>
          {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}
          <TextField
            margin="dense"
            label="Source Backup Name"
            fullWidth
            required
            value={backupName || defaultBackupName}
            onChange={(e) => setBackupName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Restore Custom Name (Optional)"
            fullWidth
            value={restoreName}
            onChange={(e) => setRestoreName(e.target.value)}
            placeholder="Auto-generated if left blank"
          />
          <TextField
            margin="dense"
            label="Velero Namespace"
            fullWidth
            value={namespace}
            onChange={(e) => setNamespace(e.target.value)}
          />
          <FormControlLabel
            control={
              <Switch
                checked={restorePVs}
                onChange={(e) => setRestorePVs(e.target.checked)}
                color="primary"
              />
            }
            label="Restore Persistent Volumes"
            style={{ marginTop: '12px' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" color="primary" variant="contained" disabled={loading}>
            {loading ? 'Restoring...' : 'Trigger Restore'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
