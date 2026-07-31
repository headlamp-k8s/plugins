import { SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useKmeshDaemonPods } from '../../hooks/useKmeshDaemonPods';
import type { DaemonAuthorizationPolicy } from '../../types/daemonApi';
import { KMESH_NAMESPACE } from '../../utils/kmeshDaemonApi';
import { useAuthzPolicies } from './useAuthzPolicies';

export default function AuthzPolicies() {
  const { readyPod, loading: podsLoading, error: podError } = useKmeshDaemonPods();
  const podName = readyPod?.name ?? null;

  const { status, data: policies, error: apiError } = useAuthzPolicies(KMESH_NAMESPACE, podName);
  const [selectedPolicy, setSelectedPolicy] = useState<DaemonAuthorizationPolicy | null>(null);

  if (podsLoading) {
    return (
      <SectionBox title="Authorization Policies active in KMesh">
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      </SectionBox>
    );
  }

  if (podError) {
    return (
      <SectionBox title="Authorization Policies active in KMesh">
        <Typography color="error">Error locating Kmesh daemon pod: {podError}</Typography>
      </SectionBox>
    );
  }

  if (!readyPod) {
    return (
      <SectionBox title="Authorization Policies active in KMesh">
        <Typography variant="body2" color="textSecondary">
          No Running+Ready Kmesh daemon pod found. Ensure the kmesh-daemon DaemonSet is healthy.
        </Typography>
      </SectionBox>
    );
  }

  if (status === 'loading') {
    return (
      <SectionBox title="Authorization Policies active in KMesh">
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      </SectionBox>
    );
  }

  if (status === 'error' || apiError) {
    const isKernelNativeMode =
      /\b400\b/.test(apiError ?? '') || /Bad Request/i.test(apiError ?? '');
    return (
      <SectionBox title="Authorization Policies active in KMesh">
        {isKernelNativeMode ? (
          <Box p={2}>
            <Typography color="error">
              Kmesh is currently running in <strong>kernel-native (ADS) mode</strong>. Authorization
              policies are only available in <strong>dual-engine (workload) mode</strong>.
            </Typography>
          </Box>
        ) : (
          <Typography color="error">
            Error fetching authorization policies from daemon ({podName}):{' '}
            {apiError ?? 'Unknown error'}
          </Typography>
        )}
      </SectionBox>
    );
  }

  return (
    <>
      <SectionBox title="Authorization Policies active in KMesh">
        <SimpleTable
          data={policies ?? []}
          columns={[
            {
              label: 'Policy Name',
              getter: (p: DaemonAuthorizationPolicy) => p.name ?? '-',
              sort: (p: DaemonAuthorizationPolicy) => p.name ?? '',
            },
            {
              label: 'Namespace',
              getter: (p: DaemonAuthorizationPolicy) => p.namespace ?? '-',
              sort: (p: DaemonAuthorizationPolicy) => p.namespace ?? '',
            },
            {
              label: 'Scope',
              getter: (p: DaemonAuthorizationPolicy) => p.scope ?? '-',
              sort: (p: DaemonAuthorizationPolicy) => p.scope ?? '',
            },
            {
              label: 'Action',
              getter: (p: DaemonAuthorizationPolicy) => p.action ?? '-',
              sort: (p: DaemonAuthorizationPolicy) => p.action ?? '',
            },
            {
              label: 'Rules',
              getter: (p: DaemonAuthorizationPolicy) => (
                <Button size="small" variant="outlined" onClick={() => setSelectedPolicy(p)}>
                  View Rules ({(p.rules ?? []).length})
                </Button>
              ),
            },
          ]}
          emptyMessage="No Authorization Policies found."
        />
      </SectionBox>

      <Dialog
        open={!!selectedPolicy}
        onClose={() => setSelectedPolicy(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Rules for {selectedPolicy?.name}</DialogTitle>
        <DialogContent>
          <Box
            component="pre"
            sx={{
              backgroundColor: 'background.default',
              p: 2,
              borderRadius: 1,
              overflowX: 'auto',
              fontSize: '0.85rem',
            }}
          >
            {selectedPolicy ? JSON.stringify(selectedPolicy.rules, null, 2) : ''}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
