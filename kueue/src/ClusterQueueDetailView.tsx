import React, { useState } from 'react';
import { useParams, Link as RouterLink, useHistory } from 'react-router-dom';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Divider,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import ResourceUsageGauge from './ResourceUsageGauge';

class ClusterQueue extends K8s.cluster.KubeObject {
  static kind = 'ClusterQueue';
  static apiName = 'clusterqueues';
  static apiVersion = 'kueue.x-k8s.io/v1beta1';
  static isNamespaced = false;

  static get className() {
    return 'ClusterQueue';
  }
}

export function ClusterQueueDetailView() {
  const { name } = useParams<{ name: string }>();
  const history = useHistory();
  const [clusterQueue, error] = ClusterQueue.useGet(name);
  const [updating, setUpdating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({
    open: false,
    msg: '',
    severity: 'success',
  });

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error.main" variant="h6">
          Failed to load ClusterQueue "{name}": {error.message || 'Not found'}
        </Typography>
        <Button component={RouterLink} to="/kueue/clusterqueues" variant="outlined" sx={{ mt: 2 }}>
          Back to List
        </Button>
      </Box>
    );
  }

  if (!clusterQueue) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  const cqName = clusterQueue.getName();
  const cohort = clusterQueue.jsonData?.spec?.cohort || 'None';
  const strategy = clusterQueue.jsonData?.spec?.queueingStrategy || 'N/A';
  const stopPolicy = clusterQueue.jsonData?.spec?.stopPolicy || 'None';
  const isStopped = stopPolicy !== 'None';
  const pending = clusterQueue.jsonData?.status?.pendingWorkloads ?? 0;
  const admitted = clusterQueue.jsonData?.status?.admittedWorkloads ?? 0;
  const flavors = clusterQueue.jsonData?.spec?.resourceGroups || [];

  // Stop / Resume Queue Handler
  const handleToggleQueueState = async () => {
    setUpdating(true);
    try {
      const updatedSpec = {
        ...clusterQueue.jsonData.spec,
        stopPolicy: isStopped ? 'None' : 'HoldAndDrain',
      };

      await clusterQueue.update({
        ...clusterQueue.jsonData,
        spec: updatedSpec,
      });

      setToast({
        open: true,
        msg: `ClusterQueue ${isStopped ? 'resumed' : 'stopped'} successfully!`,
        severity: 'success',
      });
    } catch (err: any) {
      setToast({
        open: true,
        msg: err.message || 'Failed to update queue status.',
        severity: 'error',
      });
    } finally {
      setUpdating(false);
    }
  };

  // Delete Queue Handler
  const handleDeleteQueue = async () => {
    setDeleting(true);
    try {
      await clusterQueue.delete();
      setDeleteOpen(false);
      history.push('/kueue/clusterqueues');
    } catch (err: any) {
      setToast({
        open: true,
        msg: err.message || 'Failed to delete ClusterQueue.',
        severity: 'error',
      });
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h4" fontWeight="bold">
            ClusterQueue: {cqName}
          </Typography>
          <Chip
            label={isStopped ? 'Stopped' : 'Active'}
            color={isStopped ? 'error' : 'success'}
            size="small"
          />
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            color={isStopped ? 'success' : 'warning'}
            onClick={handleToggleQueueState}
            disabled={updating}
          >
            {updating ? 'Updating...' : isStopped ? 'Resume Queue' : 'Stop Queue'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setDeleteOpen(true)}
          >
            Delete Queue
          </Button>
          <Button component={RouterLink} to="/kueue/clusterqueues" variant="outlined" size="small">
            ← Back to Queues
          </Button>
        </Box>
      </Box>

      {/* Main Details Card */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary" display="block">
              Cohort
            </Typography>
            <Chip label={cohort} color="primary" variant="outlined" size="small" sx={{ mt: 0.5 }} />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary" display="block">
              Queueing Strategy
            </Typography>
            <Typography variant="body1" fontWeight="medium" mt={0.5}>
              {strategy}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary" display="block">
              Admitted Workloads
            </Typography>
            <Typography variant="h6" color="success.main" fontWeight="bold">
              {admitted}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary" display="block">
              Pending Workloads
            </Typography>
            <Typography variant="h6" color="warning.main" fontWeight="bold">
              {pending}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Resource Quotas & Usage Section */}
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Resource Quotas & Usage
        </Typography>

        {flavors.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No resource groups configured for this queue.
          </Typography>
        ) : (
          flavors.map((rg: any, idx: number) => (
            <Paper key={idx} variant="outlined" sx={{ p: 2.5, mb: 2, backgroundColor: '#fcfcfc' }}>
              <Typography variant="subtitle1" color="primary" fontWeight="bold" mb={1}>
                Covered Resources: {rg.coveredResources?.join(', ') || 'All'}
              </Typography>

              {rg.flavors?.map((flv: any, fIdx: number) => (
                <Box key={fIdx} mt={2}>
                  <Typography variant="body2" fontWeight="medium" color="text.secondary" mb={1}>
                    Flavor: <strong>{flv.name}</strong>
                  </Typography>

                  <ResourceUsageGauge
                    resourceName="CPU"
                    used={flv.resources?.find((r: any) => r.name === 'cpu')?.nominalQuota || 10}
                    total={100}
                    unit="cores"
                  />
                  <ResourceUsageGauge
                    resourceName="Memory"
                    used={flv.resources?.find((r: any) => r.name === 'memory')?.nominalQuota || 32}
                    total={64}
                    unit="GiB"
                  />
                </Box>
              ))}
            </Paper>
          ))
        )}
      </Paper>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Delete ClusterQueue?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the ClusterQueue <strong>"{cqName}"</strong>? This action cannot be undone and may affect pending workloads assigned to this queue.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteQueue}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Alert */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert severity={toast.severity} sx={{ width: '100%' }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ClusterQueueDetailView;