import {
  Autocomplete,
  Box,
  Button,
  Chip,
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
import { useEffect, useState } from 'react';
import type { BackupCreateFormProps, BackupCreateInput } from './createTypes';

/** Create Backup form — adapted from reasonerjt prototype; namespace comes from parent. */
export default function BackupCreateForm({
  namespaces,
  storageLocations,
  onSubmit,
  onCancel,
}: BackupCreateFormProps) {
  const [name, setName] = useState('');
  const [selectedNamespaces, setSelectedNamespaces] = useState<string[]>([]);
  const [excludedNamespaces, setExcludedNamespaces] = useState<string[]>([]);
  const [includedResources, setIncludedResources] = useState<string[]>([]);
  const [excludedResources, setExcludedResources] = useState<string[]>([]);
  const [storageLocation, setStorageLocation] = useState(storageLocations[0] || '');
  const [ttl, setTtl] = useState('720h0m0s');
  const [snapshotVolumes, setSnapshotVolumes] = useState(true);
  const [defaultVolumesToFsBackup, setDefaultVolumesToFsBackup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // BSL list often arrives after mount — keep Select value in sync with real options.
  useEffect(() => {
    if (storageLocations.length === 0) {
      return;
    }
    setStorageLocation(prev => (storageLocations.includes(prev) ? prev : storageLocations[0]));
  }, [storageLocations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
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
        includedNamespaces: selectedNamespaces,
        excludedNamespaces,
        includedResources,
        excludedResources,
        storageLocation,
        ttl,
        snapshotVolumes,
        defaultVolumesToFsBackup,
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
            <FormControl fullWidth variant="outlined" required disabled={isSubmitting}>
              <InputLabel id="storage-location-label">Backup Storage Location</InputLabel>
              <Select
                labelId="storage-location-label"
                id="storage-location"
                value={storageLocation}
                onChange={e => setStorageLocation(e.target.value as string)}
                label="Backup Storage Location"
              >
                {storageLocations.length === 0 ? (
                  <MenuItem value="" disabled>
                    No storage locations available
                  </MenuItem>
                ) : (
                  storageLocations.map(loc => (
                    <MenuItem key={loc} value={loc}>
                      {loc}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              freeSolo
              id="included-namespaces"
              options={namespaces}
              value={selectedNamespaces}
              onChange={(_, newValue) => setSelectedNamespaces(newValue)}
              renderInput={params => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Included Namespaces"
                  placeholder="Select or type namespaces (empty for all)"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip label={option} {...getTagProps({ index })} size="small" />
                ))
              }
              disabled={isSubmitting}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              freeSolo
              id="excluded-namespaces"
              options={namespaces}
              value={excludedNamespaces}
              onChange={(_, newValue) => setExcludedNamespaces(newValue)}
              renderInput={params => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Excluded Namespaces"
                  placeholder="Select or type namespaces to exclude"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip label={option} {...getTagProps({ index })} size="small" />
                ))
              }
              disabled={isSubmitting}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              freeSolo
              id="included-resources"
              options={[]}
              value={includedResources}
              onChange={(_, newValue) => setIncludedResources(newValue)}
              renderInput={params => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Included Resources"
                  placeholder="Type resource and press Enter (e.g., pods)"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip label={option} {...getTagProps({ index })} size="small" />
                ))
              }
              disabled={isSubmitting}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              freeSolo
              id="excluded-resources"
              options={[]}
              value={excludedResources}
              onChange={(_, newValue) => setExcludedResources(newValue)}
              renderInput={params => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Excluded Resources"
                  placeholder="Type resource to exclude and press Enter"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip label={option} {...getTagProps({ index })} size="small" />
                ))
              }
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

          <Grid item xs={12} md={6} display="flex" flexDirection="column" justifyContent="center">
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
            <FormControlLabel
              control={
                <Switch
                  checked={defaultVolumesToFsBackup}
                  onChange={e => setDefaultVolumesToFsBackup(e.target.checked)}
                  color="primary"
                  disabled={isSubmitting}
                />
              }
              label="Default volumes to FS backup (kopia)"
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
