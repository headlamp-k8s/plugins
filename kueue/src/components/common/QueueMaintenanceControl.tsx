import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { AuthVisible, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import type { StopPolicy } from '../../resources/clusterQueue';
import {
  createStopPolicyPatch,
  getStopPolicyColor,
  getStopPolicyDescription,
  getStopPolicyLabel,
} from '../../resources/queueControlFormatters';

export type QueueResource = KubeObject & {
  stopPolicy?: string;
};

interface QueueMaintenanceControlProps {
  queue: QueueResource;
  queueType: 'ClusterQueue' | 'LocalQueue';
}

export default function QueueMaintenanceControl({
  queue,
  queueType,
}: QueueMaintenanceControlProps) {
  const { t } = useTranslation();
  const rawPolicy = queue.stopPolicy;
  const currentPolicy: StopPolicy =
    !rawPolicy || rawPolicy === '-' || rawPolicy === 'None' ? 'None' : (rawPolicy as StopPolicy);
  const [pendingPolicy, setPendingPolicy] = useState<StopPolicy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDrainOpen, setConfirmDrainOpen] = useState(false);

  const isLoading = pendingPolicy !== null;
  const currentLabel = getStopPolicyLabel(currentPolicy, t);
  const currentDescription = getStopPolicyDescription(currentPolicy, t);

  const applyPolicy = async (targetPolicy: StopPolicy) => {
    setPendingPolicy(targetPolicy);
    setError(null);
    try {
      await queue.patch(createStopPolicyPatch(targetPolicy));
    } catch (err: any) {
      setError(err?.message || t('Failed to update queue stop policy.'));
    } finally {
      setPendingPolicy(null);
      setConfirmDrainOpen(false);
    }
  };

  return (
    <SectionBox title={t('Queue Maintenance & Stop Policy')}>
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
        >
          <Box>
            <Box display="flex" alignItems="center" gap={1.5} mb={1}>
              <Typography variant="subtitle1" fontWeight="bold">
                {t('Current State')}:
              </Typography>
              <Chip
                label={currentLabel}
                color={getStopPolicyColor(currentPolicy)}
                size="small"
                variant="filled"
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {currentDescription}
            </Typography>
          </Box>

          <AuthVisible item={queue} authVerb="patch" namespace={queue.metadata?.namespace}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              {currentPolicy !== 'None' && (
                <Button
                  variant="outlined"
                  color="success"
                  size="small"
                  disabled={isLoading}
                  onClick={() => applyPolicy('None')}
                >
                  {pendingPolicy === 'None' ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                  {t('Clear Stop Policy (None)')}
                </Button>
              )}

              {currentPolicy !== 'Hold' && (
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  disabled={isLoading}
                  onClick={() => applyPolicy('Hold')}
                >
                  {pendingPolicy === 'Hold' ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                  {t('Pause Admissions (Hold)')}
                </Button>
              )}

              {currentPolicy !== 'HoldAndDrain' && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  disabled={isLoading}
                  onClick={() => setConfirmDrainOpen(true)}
                >
                  {t('Drain Queue (HoldAndDrain)')}
                </Button>
              )}
            </Stack>
          </AuthVisible>
        </Box>

        {/* Confirmation modal for draining queue */}
        <Dialog open={confirmDrainOpen} onClose={() => setConfirmDrainOpen(false)}>
          <DialogTitle>{t('Confirm Queue Drainage')}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {t(
                'Are you sure you want to set {{queueType}} "{{name}}" to HoldAndDrain? This will block new admissions, evict admitted workloads, and cancel reservations for Reserving workloads.',
                { queueType, name: queue.metadata?.name || '' }
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDrainOpen(false)} disabled={isLoading}>
              {t('Cancel')}
            </Button>
            <Button
              onClick={() => applyPolicy('HoldAndDrain')}
              color="error"
              variant="contained"
              disabled={isLoading}
            >
              {pendingPolicy === 'HoldAndDrain' ? (
                <CircularProgress size={16} sx={{ mr: 1, color: 'inherit' }} />
              ) : null}
              {t('Confirm & Drain')}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </SectionBox>
  );
}
