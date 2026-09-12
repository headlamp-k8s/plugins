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
import { VeleroBackup } from '../../resources/backup';

interface CreateBackupDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateBackupDialog: React.FC<CreateBackupDialogProps> = ({ open, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [namespace, setNamespace] = useState('velero');
  const [includedNamespaces, setIncludedNamespaces] = useState('');
  const [storageLocation, setStorageLocation] = useState('default');
  const [ttl, setTtl] = useState('720h0m0s');
  const [snapshotVolumes, setSnapshotVolumes] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Backup name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    const nsList = includedNamespaces
      .split(',')
      .map((ns) => ns.trim())
      .filter((ns) => ns.length > 0);

    const backupPayload = {
      apiVersion: 'velero.io/v1',
      kind: 'Backup',
      metadata: {
        name: name.trim(),
        namespace: namespace.trim(),
      },
      spec: {
        includedNamespaces: nsList.length > 0 ? nsList : ['*'],
        storageLocation: storageLocation.trim(),
        ttl: ttl.trim(),
        snapshotVolumes: snapshotVolumes,
      },
    };

    try {
      await VeleroBackup.apiEndpoint.post(backupPayload);
      setName('');
      setIncludedNamespaces('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create backup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create On-Demand Velero Backup</DialogTitle>
        <DialogContent>
          {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}
          <TextField
            margin="dense"
            label="Backup Name"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Velero Namespace"
            fullWidth
            value={namespace}
            onChange={(e) => setNamespace(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Included Namespaces (comma-separated, leave empty for all)"
            fullWidth
            value={includedNamespaces}
            onChange={(e) => setIncludedNamespaces(e.target.value)}
            placeholder="e.g. default, kube-system"
          />
          <TextField
            margin="dense"
            label="Storage Location"
            fullWidth
            value={storageLocation}
            onChange={(e) => setStorageLocation(e.target.value)}
          />
          <TextField
            margin="dense"
            label="TTL (Time To Live)"
            fullWidth
            value={ttl}
            onChange={(e) => setTtl(e.target.value)}
          />
          <FormControlLabel
            control={
              <Switch
                checked={snapshotVolumes}
                onChange={(e) => setSnapshotVolumes(e.target.checked)}
                color="primary"
              />
            }
            label="Snapshot Volumes"
            style={{ marginTop: '12px' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" color="primary" variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create Backup'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
