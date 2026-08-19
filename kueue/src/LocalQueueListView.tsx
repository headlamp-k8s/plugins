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

class LocalQueue extends K8s.cluster.KubeObject {
  static kind = 'LocalQueue';
  static apiName = 'localqueues';
  static apiVersion = 'kueue.x-k8s.io/v1beta1';
  static isNamespaced = true;

  static get className() {
    return 'LocalQueue';
  }
}

export function LocalQueueListView({ localQueues: customQueues }: { localQueues?: any[] } = {}) {
  const [fetchedQueues, error] = LocalQueue.useList();
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
        <Typography color="error">Failed to load LocalQueues: {error.message}</Typography>
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
      await LocalQueue.apiEndpoint.post(parsed);
      setToast({ open: true, msg: 'LocalQueue created successfully!', severity: 'success' });
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
          LocalQueues
        </Typography>
        <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
          + Create LocalQueue
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Namespace</strong></TableCell>
              <TableCell><strong>ClusterQueue</strong></TableCell>
              <TableCell><strong>Pending Workloads</strong></TableCell>
              <TableCell><strong>Admitted Workloads</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {queues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No LocalQueues found.
                </TableCell>
              </TableRow>
            ) : (
              queues.map((lq: any) => {
                const name = lq.getName ? lq.getName() : lq.metadata?.name;
                const ns = lq.getNamespace ? lq.getNamespace() : lq.metadata?.namespace;
                const spec = lq.jsonData?.spec || lq.spec || {};
                const status = lq.jsonData?.status || lq.status || {};

                return (
                  <TableRow key={`${ns}/${name}`} hover>
                    <TableCell>
                      <RouterLink to={`/kueue/localqueues/${ns}/${name}`} style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 600 }}>
                        {name}
                      </RouterLink>
                    </TableCell>
                    <TableCell>
                      <Chip label={ns || 'default'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{spec.clusterQueue || 'N/A'}</TableCell>
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
        <DialogTitle>Create LocalQueue (JSON)</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Paste LocalQueue Resource JSON"
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

export default LocalQueueListView;