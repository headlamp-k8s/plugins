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
import { useState } from 'react';
import type { RestoreCreateFormProps, RestoreCreateInput } from './createTypes';

/** Create Restore form — adapted from reasonerjt prototype. */
export default function RestoreCreateForm({
  backups,
  namespaces,
  defaultBackupName = '',
  onSubmit,
  onCancel,
}: RestoreCreateFormProps) {
  const [name, setName] = useState('');
  const [backupName, setBackupName] = useState(defaultBackupName || backups[0] || '');
  const [includedNamespaces, setIncludedNamespaces] = useState<string[]>([]);
  const [excludedNamespaces, setExcludedNamespaces] = useState<string[]>([]);
  const [restorePVs, setRestorePVs] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Restore name is required');
      return;
    }
    if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(name.trim())) {
      setError('Name must be a valid DNS-1123 label (lowercase alphanumeric and -)');
      return;
    }
    if (!backupName.trim()) {
      setError('Backup name is required');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const values: RestoreCreateInput = {
        name: name.trim(),
        backupName: backupName.trim(),
        includedNamespaces,
        excludedNamespaces,
        restorePVs,
      };
      await onSubmit(values);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create restore');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ padding: 4, borderRadius: 2 }} elevation={2}>
      <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ marginBottom: 3 }}>
        Create Restore
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
              label="Restore Name"
              variant="outlined"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g., shop-restore-1"
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined" required disabled={loading}>
              <InputLabel id="backup-name-label">Backup Source</InputLabel>
              {backups.length > 0 ? (
                <Select
                  labelId="backup-name-label"
                  id="backup-name"
                  value={backupName}
                  onChange={e => setBackupName(e.target.value)}
                  label="Backup Source"
                >
                  {backups.map(b => (
                    <MenuItem key={b} value={b}>
                      {b}
                    </MenuItem>
                  ))}
                </Select>
              ) : (
                <TextField
                  fullWidth
                  variant="outlined"
                  value={backupName}
                  onChange={e => setBackupName(e.target.value)}
                  placeholder="Enter backup name"
                  disabled={loading}
                  label="Backup Source"
                />
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              freeSolo
              id="included-namespaces"
              options={namespaces}
              value={includedNamespaces}
              onChange={(_, newValue) => setIncludedNamespaces(newValue)}
              renderInput={params => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Included Namespaces"
                  placeholder="Select or type namespaces from the backup"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip label={option} {...getTagProps({ index })} size="small" />
                ))
              }
              disabled={loading}
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
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} display="flex" alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={restorePVs}
                  onChange={e => setRestorePVs(e.target.checked)}
                  color="primary"
                  disabled={loading}
                />
              }
              label="Restore Persistent Volumes (PVs)"
            />
          </Grid>
        </Grid>

        <Box marginTop={4} display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create Restore'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
}
