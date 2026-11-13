import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import FreeSoloMulti from '../common/FreeSoloMulti';
import { useFreeSoloMulti } from '../common/useFreeSoloMulti';
import {
  type BackupCreateFormProps,
  type BackupCreateInput,
  type FsBackupChoice,
  fsBackupChoiceToSpec,
  isUnavailableStorageLocation,
} from './createTypes';

/** Create Backup form — adapted from reasonerjt prototype; namespace comes from parent. */
export default function BackupCreateForm({
  namespaces,
  storageLocations,
  onSubmit,
  onCancel,
}: BackupCreateFormProps) {
  const [name, setName] = useState('');
  const includedNamespaces = useFreeSoloMulti();
  const excludedNamespaces = useFreeSoloMulti();
  const includedResources = useFreeSoloMulti();
  const excludedResources = useFreeSoloMulti();
  const [storageLocation, setStorageLocation] = useState('');
  const [ttl, setTtl] = useState('720h0m0s');
  const [snapshotVolumes, setSnapshotVolumes] = useState(true);
  const [fsBackup, setFsBackup] = useState<FsBackupChoice>('server');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (isUnavailableStorageLocation(storageLocation, storageLocations)) {
      setError(
        'The selected storage location is no longer available. Choose another location or Velero default.'
      );
      return;
    }
    if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(name.trim())) {
      setError('Name must be a valid DNS-1123 label (lowercase alphanumeric and -)');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const values: BackupCreateInput = {
        name: name.trim(),
        includedNamespaces: includedNamespaces.commit(),
        excludedNamespaces: excludedNamespaces.commit(),
        includedResources: includedResources.commit(),
        excludedResources: excludedResources.commit(),
        storageLocation,
        ttl,
        snapshotVolumes,
        defaultVolumesToFsBackup: fsBackupChoiceToSpec(fsBackup),
      };
      await onSubmit(values);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create backup';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper sx={{ padding: 4, borderRadius: 2 }} elevation={2}>
      <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ marginBottom: 3 }}>
        Create Backup
      </Typography>

      {error && (
        <Box
          sx={{
            backgroundColor: 'error.light',
            color: 'error.contrastText',
            padding: 2,
            borderRadius: 1,
            marginBottom: 3,
          }}
        >
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Backup Name"
              variant="outlined"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g., shop-manual-1"
              disabled={isSubmitting}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined" disabled={isSubmitting}>
              <InputLabel id="storage-location-label">Backup Storage Location</InputLabel>
              <Select
                labelId="storage-location-label"
                id="storage-location"
                value={storageLocation}
                onChange={e => setStorageLocation(e.target.value)}
                label="Backup Storage Location"
              >
                <MenuItem value="">Velero default</MenuItem>
                {isUnavailableStorageLocation(storageLocation, storageLocations) && (
                  <MenuItem value={storageLocation}>{storageLocation} (unavailable)</MenuItem>
                )}
                {storageLocations.map(loc => (
                  <MenuItem key={loc} value={loc}>
                    {loc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FreeSoloMulti
              id="included-namespaces"
              label="Included Namespaces"
              placeholder="Select or type namespaces (empty for all)"
              options={namespaces}
              value={includedNamespaces.value}
              onChange={includedNamespaces.setValue}
              onInputChange={includedNamespaces.onInputChange}
              disabled={isSubmitting}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FreeSoloMulti
              id="excluded-namespaces"
              label="Excluded Namespaces"
              placeholder="Select or type namespaces to exclude"
              options={namespaces}
              value={excludedNamespaces.value}
              onChange={excludedNamespaces.setValue}
              onInputChange={excludedNamespaces.onInputChange}
              disabled={isSubmitting}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FreeSoloMulti
              id="included-resources"
              label="Included Resources"
              placeholder="Type resource and press Enter (e.g., pods)"
              options={[]}
              value={includedResources.value}
              onChange={includedResources.setValue}
              onInputChange={includedResources.onInputChange}
              disabled={isSubmitting}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FreeSoloMulti
              id="excluded-resources"
              label="Excluded Resources"
              placeholder="Type resource to exclude and press Enter"
              options={[]}
              value={excludedResources.value}
              onChange={excludedResources.setValue}
              onInputChange={excludedResources.onInputChange}
              disabled={isSubmitting}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="TTL (Time To Live)"
              variant="outlined"
              value={ttl}
              onChange={e => setTtl(e.target.value)}
              placeholder="e.g., 720h0m0s"
              disabled={isSubmitting}
              helperText="Format: duration (e.g., 720h0m0s for 30 days)"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined" disabled={isSubmitting}>
              <InputLabel id="fs-backup-label">Volume file backup (kopia)</InputLabel>
              <Select
                labelId="fs-backup-label"
                id="fs-backup"
                value={fsBackup}
                onChange={e => setFsBackup(e.target.value as FsBackupChoice)}
                label="Volume file backup (kopia)"
              >
                <MenuItem value="server">Server default</MenuItem>
                <MenuItem value="on">On</MenuItem>
                <MenuItem value="off">Off</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={snapshotVolumes}
                  onChange={e => setSnapshotVolumes(e.target.checked)}
                  color="primary"
                  disabled={isSubmitting}
                />
              }
              label="Snapshot Volumes (CSI)"
            />
          </Grid>
        </Grid>

        <Box marginTop={4} display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create Backup'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
}
