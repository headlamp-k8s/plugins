import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { AuthVisible, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
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
} from '../../resources/queueControlFormatters';

interface QueueResource {
  stopPolicy?: string;
  metadata?: {
    name?: string;
    namespace?: string;
  };
  patch: (data: any) => Promise<any>;
}

interface QueueMaintenanceControlProps {
  queue: QueueResource;
  queueClass: KubeObjectClass;
  queueType: 'ClusterQueue' | 'LocalQueue';
}

export default function QueueMaintenanceControl({
  queue,
  queueClass,
  queueType,
}: QueueMaintenanceControlProps) {
  const { t } = useTranslation();
  const currentPolicy = (queue.stopPolicy as StopPolicy) || 'None';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDrainOpen, setConfirmDrainOpen] = useState(false);

  const labels: Record<string, string> = {
    HoldAndDrain: t('Drain (HoldAndDrain)'),
    Hold: t('Paused (Hold)'),
    None: t('Active (None)'),
  };

  const descriptions: Record<string, string> = {
    HoldAndDrain: t(
      'Queue is in Drain mode: new admissions are blocked and running workloads are evicted.'
    ),
    Hold: t(
      'Queue is in Pause mode: new admissions are blocked. In-flight workloads continue running.'
    ),
    None: t('Queue is Active and admitting pending workloads normally.'),
  };

  const currentLabel = labels[currentPolicy] || currentPolicy;
  const currentDescription =
    descriptions[currentPolicy] || t('Custom stop policy: {{policy}}', { policy: currentPolicy });

  const applyPolicy = async (targetPolicy: StopPolicy) => {
    setLoading(true);
    setError(null);
    try {
      await queue.patch(createStopPolicyPatch(targetPolicy));
    } catch (err: any) {
      setError(err?.message || t('Failed to update queue stop policy.'));
    } finally {
      setLoading(false);
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

        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
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

          <AuthVisible
            item={queueClass}
            authVerb="patch"
            namespace={queue.metadata?.namespace}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              {currentPolicy !== 'None' && (
                <Button
                  variant="outlined"
                  color="success"
                  size="small"
                  disabled={loading}
                  onClick={() => applyPolicy('None')}
                >
                  {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                  {t('Resume Admissions (Active)')}
                </Button>
              )}

              {currentPolicy !== 'Hold' && (
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  disabled={loading}
                  onClick={() => applyPolicy('Hold')}
                >
                  {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                  {t('Pause Admissions (Hold)')}
                </Button>
              )}

              {currentPolicy !== 'HoldAndDrain' && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  disabled={loading}
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
                'Are you sure you want to set {{queueType}} "{{name}}" to HoldAndDrain? This will pause all new admissions and immediately evict all running workloads admitted to this queue.',
                { queueType, name: queue.metadata?.name || '' }
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDrainOpen(false)} disabled={loading}>
              {t('Cancel')}
            </Button>
            <Button
              onClick={() => applyPolicy('HoldAndDrain')}
              color="error"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={16} sx={{ mr: 1, color: 'inherit' }} /> : null}
              {t('Confirm & Drain')}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </SectionBox>
  );
}
