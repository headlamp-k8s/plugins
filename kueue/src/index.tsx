import {
  registerRoute,
  registerSidebarEntry,
  K8s,
} from '@kinvolk/headlamp-plugin/lib';
import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Box,
  CircularProgress,
  Link,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
} from '@mui/material';
import { ClusterQueueDetailView } from './ClusterQueueDetailView';
import { LocalQueueListView } from './LocalQueueListView';

// 1. ClusterQueue KubeObject Class
class ClusterQueue extends K8s.cluster.KubeObject {
  static kind = 'ClusterQueue';
  static apiName = 'clusterqueues';
  static apiVersion = 'kueue.x-k8s.io/v1beta1';
  static isNamespaced = false;

  static get className() {
    return 'ClusterQueue';
  }
}

// Default JSON/YAML template for new queues
const SAMPLE_CLUSTER_QUEUE_JSON = JSON.stringify(
  {
    apiVersion: 'kueue.x-k8s.io/v1beta1',
    kind: 'ClusterQueue',
    metadata: {
      name: 'sample-cluster-queue',
    },
    spec: {
      namespaceSelector: {},
      cohort: 'team-a',
      queueingStrategy: 'BestEffortFIFO',
      resourceGroups: [
        {
          coveredResources: ['cpu', 'memory'],
          flavors: [
            {
              name: 'default-flavor',
              resources: [
                { name: 'cpu', nominalQuota: '10' },
                { name: 'memory', nominalQuota: '32Gi' },
              ],
            },
          ],
        },
      ],
    },
  },
  null,
  2
);

// 2. List View Component with Create Action
function ClusterQueueListView() {
  const [clusterQueues, error] = ClusterQueue.useList();
  const [createOpen, setCreateOpen] = useState(false);
  const [jsonContent, setJsonContent] = useState(SAMPLE_CLUSTER_QUEUE_JSON);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({
    open: false,
    msg: '',
    severity: 'success',
  });

  const handleCreate = async () => {
    setCreating(true);
    try {
      const parsedObject = JSON.parse(jsonContent);
      await ClusterQueue.apiEndpoint.post(parsedObject);

      setToast({ open: true, msg: 'ClusterQueue created successfully!', severity: 'success' });
      setCreateOpen(false);
    } catch (err: any) {
      setToast({ open: true, msg: err.message || 'Invalid JSON format or API error.', severity: 'error' });
    } finally {
      setCreating(false);
    }
  };

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error.main" variant="h6">
          Failed to fetch ClusterQueues: {error.message || 'Check cluster permissions.'}
        </Typography>
      </Box>
    );
  }

  if (clusterQueues === null) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight="bold">
          Kueue Cluster Queues
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setCreateOpen(true)}
        >
          + Create Queue
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mt: 2 }}>
        <Table sx={{ minWidth: 500 }}>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Cohort</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Strategy</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Pending</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Admitted</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clusterQueues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary" py={2}>
                    No Cluster Queues found in cluster.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              clusterQueues.map((cq: any) => {
                const name = cq.getName();
                const cohort = cq.jsonData?.spec?.cohort || 'None';
                const strategy = cq.jsonData?.spec?.queueingStrategy || 'N/A';
                const pending = cq.jsonData?.status?.pendingWorkloads ?? 0;
                const admitted = cq.jsonData?.status?.admittedWorkloads ?? 0;

                return (
                  <TableRow key={name} hover>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      <Link
                        component={RouterLink}
                        to={`/kueue/clusterqueues/${name}`}
                        underline="hover"
                        color="primary"
                        fontWeight="bold"
                      >
                        {name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Chip label={cohort} size="small" variant="outlined" color="primary" />
                    </TableCell>
                    <TableCell>{strategy}</TableCell>
                    <TableCell align="right" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                      {pending}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                      {admitted}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Modal */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Create New ClusterQueue (JSON)</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={14}
            fullWidth
            value={jsonContent}
            onChange={(e) => setJsonContent(e.target.value)}
            sx={{ fontFamily: 'monospace', mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} color="primary" variant="contained" disabled={creating}>
            {creating ? 'Creating...' : 'Create Queue'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity}>{toast.msg}</Alert>
      </Snackbar>
    </Box>
  );
}

// 3. Register Navigation & Routes
registerSidebarEntry({
  name: 'kueue',
  label: 'Kueue Queues',
  url: '/kueue/clusterqueues',
  icon: 'mdi:queue-first-in-first-out',
});

registerSidebarEntry({
  name: 'localqueues',
  label: 'Local Queues',
  url: '/kueue/localqueues',
  parent: 'kueue',
});

registerRoute({
  path: '/kueue/clusterqueues',
  sidebar: 'kueue',
  name: 'ClusterQueues',
  exact: true,
  component: () => <ClusterQueueListView />,
});

registerRoute({
  path: '/kueue/clusterqueues/:name',
  sidebar: 'kueue',
  name: 'ClusterQueueDetail',
  exact: true,
  component: () => <ClusterQueueDetailView />,
});

registerRoute({
  path: '/kueue/localqueues',
  sidebar: 'kueue',
  name: 'LocalQueues',
  exact: true,
  component: () => <LocalQueueListView />,
});