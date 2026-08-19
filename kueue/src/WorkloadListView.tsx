import React from 'react';
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
  CircularProgress,
} from '@mui/material';

class Workload extends K8s.cluster.KubeObject {
  static kind = 'Workload';
  static apiName = 'workloads';
  static apiVersion = 'kueue.x-k8s.io/v1beta1';
  static isNamespaced = true;

  static get className() {
    return 'Workload';
  }
}

export function WorkloadListView({ workloads: customWorkloads }: { workloads?: any[] } = {}) {
  const [fetchedWorkloads, error] = Workload.useList();
  const workloads = customWorkloads || fetchedWorkloads;

  if (error && !customWorkloads) {
    return (
      <Box p={3}>
        <Typography color="error">Failed to load Workloads: {error.message}</Typography>
      </Box>
    );
  }

  if (!workloads) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Workloads
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Namespace</strong></TableCell>
              <TableCell><strong>Queue</strong></TableCell>
              <TableCell><strong>Priority</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workloads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No Workloads found.
                </TableCell>
              </TableRow>
            ) : (
              workloads.map((wl: any) => {
                const name = wl.getName ? wl.getName() : wl.metadata?.name;
                const ns = wl.getNamespace ? wl.getNamespace() : wl.metadata?.namespace;
                const spec = wl.jsonData?.spec || wl.spec || {};
                const status = wl.jsonData?.status || wl.status || {};
                const isAdmitted = status.conditions?.some((c: any) => c.type === 'Admitted' && c.status === 'True');

                return (
                  <TableRow key={`${ns}/${name}`} hover>
                    <TableCell>{name}</TableCell>
                    <TableCell>
                      <Chip label={ns || 'default'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{spec.queueName || 'N/A'}</TableCell>
                    <TableCell>{spec.priority ?? 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={isAdmitted ? 'Admitted' : 'Pending'}
                        color={isAdmitted ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default WorkloadListView;
