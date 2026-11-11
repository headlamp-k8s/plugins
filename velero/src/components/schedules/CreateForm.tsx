import {
  Box,
  Button,
  FormControlLabel,
  Grid,
  Paper,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import FreeSoloMulti from '../common/FreeSoloMulti';
import { useFreeSoloMulti } from '../common/useFreeSoloMulti';
import type { ScheduleCreateFormProps, ScheduleCreateInput } from './createTypes';

/** Create Schedule form — cron + namespace scope (Phase 4). */
export default function ScheduleCreateForm({
  namespaces,
  onSubmit,
  onCancel,
}: ScheduleCreateFormProps) {
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('@every 24h');
  const includedNamespaces = useFreeSoloMulti();
  const excludedNamespaces = useFreeSoloMulti();
  const [ttl, setTtl] = useState('720h0m0s');
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Schedule name is required');
      return;
    }
    if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(name.trim())) {
      setError('Name must be a valid DNS-1123 label (lowercase alphanumeric and -)');
      return;
    }
    if (!schedule.trim()) {
      setError('Cron / schedule expression is required');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const values: ScheduleCreateInput = {
        name: name.trim(),
        schedule: schedule.trim(),
        includedNamespaces: includedNamespaces.commit(),
        excludedNamespaces: excludedNamespaces.commit(),
        ttl,
        paused,
      };
      await onSubmit(values);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ padding: 4, borderRadius: 2 }} elevation={2}>
      <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ marginBottom: 3 }}>
        Create Schedule
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
              label="Schedule Name"
              variant="outlined"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g., shop-nightly"
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Cron / schedule"
              variant="outlined"
              value={schedule}
              onChange={e => setSchedule(e.target.value)}
              required
              placeholder="e.g., @every 2h or 0 2 * * *"
              disabled={loading}
              helperText="Velero cron or @every duration"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FreeSoloMulti
              id="schedule-included-namespaces"
              label="Included Namespaces"
              placeholder="Select or type (empty = all)"
              options={namespaces}
              value={includedNamespaces.value}
              onChange={includedNamespaces.setValue}
              onInputChange={includedNamespaces.onInputChange}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FreeSoloMulti
              id="schedule-excluded-namespaces"
              label="Excluded Namespaces"
              placeholder="Select or type (optional)"
              options={namespaces}
              value={excludedNamespaces.value}
              onChange={excludedNamespaces.setValue}
              onInputChange={excludedNamespaces.onInputChange}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Backup TTL"
              value={ttl}
              onChange={e => setTtl(e.target.value)}
              disabled={loading}
              helperText="Applied to backups created by this schedule"
            />
          </Grid>
          <Grid item xs={12} md={6} display="flex" alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={paused}
                  onChange={e => setPaused(e.target.checked)}
                  disabled={loading}
                />
              }
              label="Create paused"
            />
          </Grid>
        </Grid>

        <Box marginTop={4} display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create Schedule'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
}
