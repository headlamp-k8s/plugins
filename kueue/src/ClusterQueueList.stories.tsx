import React, { useState } from 'react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

class ClusterQueue extends K8s.cluster.KubeObject {
  static kind = 'ClusterQueue';
  static apiName = 'clusterqueues';
  static apiVersion = 'kueue.x-k8s.io/v1beta1';
  static isNamespaced = false;

  static get className() {
    return 'ClusterQueue';
  }
}

// Ensure "export function" is present here:
export function ClusterQueueListView({ clusterQueues: customQueues }: { clusterQueues?: any[] } = {}) {
  const [fetchedQueues, error] = ClusterQueue.useList();
  const queues = customQueues || fetchedQueues;

  const [open, setOpen] = useState(false);
  const [yamlData, setYamlData] = useState('');
  const [toast, setToast] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({
    open: false,
    msg: '',
    severity: 'success',
  });

  if (error && !customQueues) {
    return (
      <Box p={3}>
        <Typography color="error">Failed to load ClusterQueues: {error.message}</Typography>
      </Box>
    );
  }

  if (!queues) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  const handleCreate = async () => {
    try {
      const parsed = JSON.parse(yamlData);
      await ClusterQueue.apiEndpoint.post(parsed);
      setToast({ open: true, msg: 'ClusterQueue created successfully!', severity: 'success' });
      setOpen(false);
      setYamlData('');
    } catch (err: any) {
      setToast({ open: true, msg: err.message || 'Invalid JSON/Resource creation failed', severity: 'error' });
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          ClusterQueues
        </Typography>
        <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
          + Create ClusterQueue
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Cohort</strong></TableCell>
              <TableCell><strong>Strategy</strong></TableCell>
              <TableCell><strong>Pending Workloads</strong></TableCell>
              <TableCell><strong>Admitted Workloads</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {queues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No ClusterQueues found.
                </TableCell>
              </TableRow>
            ) : (
              queues.map((cq: any) => {
                const name = cq.getName ? cq.getName() : cq.metadata?.name;
                const spec = cq.jsonData?.spec || cq.spec || {};
                const status = cq.jsonData?.status || cq.status || {};

                return (
                  <TableRow key={name} hover>
                    <TableCell>
                      <RouterLink to={`/kueue/clusterqueues/${name}`} style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 600 }}>
                        {name}
                      </RouterLink>
                    </TableCell>
                    <TableCell>
                      <Chip label={spec.cohort || 'None'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{spec.queueingStrategy || 'N/A'}</TableCell>
                    <TableCell>{status.pendingWorkloads ?? 0}</TableCell>
                    <TableCell>{status.admittedWorkloads ?? 0}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create ClusterQueue (JSON)</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Paste ClusterQueue Resource JSON"
            type="text"
            fullWidth
            multiline
            rows={10}
            variant="outlined"
            value={yamlData}
            onChange={(e) => setYamlData(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity}>{toast.msg}</Alert>
      </Snackbar>
    </Box>
  );
}

export default ClusterQueueListView;