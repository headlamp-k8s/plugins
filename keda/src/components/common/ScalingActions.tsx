import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ActionButton, ConfirmDialog } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

const PAUSED_ANNOTATION = 'autoscaling.keda.sh/paused';
const PAUSED_REPLICAS_ANNOTATION = 'autoscaling.keda.sh/paused-replicas';

export function isPaused(resource: KubeObject): boolean {
  return resource?.jsonData?.metadata?.annotations?.[PAUSED_ANNOTATION] === 'true';
}

export function hasPausedReplicas(resource: KubeObject): boolean {
  return (
    resource?.jsonData?.metadata?.annotations?.[PAUSED_REPLICAS_ANNOTATION] !== undefined &&
    resource?.jsonData?.metadata?.annotations?.[PAUSED_REPLICAS_ANNOTATION] !== null
  );
}

function getPausedReplicasValue(resource: KubeObject): string {
  return resource?.jsonData?.metadata?.annotations?.[PAUSED_REPLICAS_ANNOTATION] || '0';
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function patchAnnotations(resource: KubeObject, annotations: Record<string, string | null>) {
  return resource.patch({
    metadata: {
      annotations,
    },
  });
}

export function PauseScalingAction({ resource }: { resource: KubeObject }) {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (!resource || isPaused(resource) || hasPausedReplicas(resource)) {
    return null;
  }

  return (
    <>
      <ActionButton
        description={t('Pause Scaling')}
        icon="mdi:pause"
        onClick={() => setOpen(true)}
      />
      <ConfirmDialog
        open={open}
        handleClose={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          patchAnnotations(resource, { [PAUSED_ANNOTATION]: 'true' })
            .then(response => {
              if (response.metadata.annotations?.[PAUSED_ANNOTATION] === 'true') {
                enqueueSnackbar(
                  t('Successfully paused scaling for {{name}}', { name: resource.metadata.name }),
                  { variant: 'success' }
                );
              } else {
                enqueueSnackbar(
                  t('Failed to pause scaling for {{name}}', { name: resource.metadata.name }),
                  { variant: 'error' }
                );
              }
            })
            .catch(error => {
              enqueueSnackbar(
                t('Failed to pause scaling for {{name}}: {{error}}', {
                  name: resource.metadata.name,
                  error: formatError(error),
                }),
                { variant: 'error' }
              );
            });
        }}
        title={t('Pause Scaling')}
        description={t('Are you sure you want to pause scaling for {{name}}?', {
          name: resource.metadata.name,
        })}
      />
    </>
  );
}

export function PausedReplicasAction({ resource }: { resource: KubeObject }) {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [replicas, setReplicas] = useState('');

  if (!resource || isPaused(resource)) {
    return null;
  }

  return (
    <>
      <ActionButton
        description={t('Set Paused Replicas')}
        icon="mdi:pause-octagon"
        onClick={() => {
          setReplicas(getPausedReplicasValue(resource));
          setOpen(true);
        }}
      />
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{t('Set Paused Replicas')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('Pause scaling for')} <strong>{resource.metadata.name}</strong>{' '}
            {t('and set the replica count to a specific value.')}
          </DialogContentText>
          <TextField
            margin="dense"
            label={t('Replicas')}
            type="number"
            fullWidth
            value={replicas}
            onChange={e => setReplicas(e.target.value)}
            inputProps={{ min: 0, step: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('Cancel')}</Button>
          <Button
            onClick={() => {
              const trimmedReplicas = replicas.trim();
              const value = Number(trimmedReplicas);
              if (trimmedReplicas === '' || !Number.isInteger(value) || value < 0) {
                enqueueSnackbar(t('Invalid number: replicas must be a non-negative integer'), {
                  variant: 'error',
                });
                return;
              }
              setOpen(false);
              patchAnnotations(resource, { [PAUSED_REPLICAS_ANNOTATION]: String(value) })
                .then(response => {
                  if (
                    response.metadata.annotations?.[PAUSED_REPLICAS_ANNOTATION] === String(value)
                  ) {
                    enqueueSnackbar(
                      t('Successfully set paused replicas to {{value}} for {{name}}', {
                        value,
                        name: resource.metadata.name,
                      }),
                      { variant: 'success' }
                    );
                  } else {
                    enqueueSnackbar(
                      t('Failed to set paused replicas for {{name}}', {
                        name: resource.metadata.name,
                      }),
                      { variant: 'error' }
                    );
                  }
                })
                .catch(error => {
                  enqueueSnackbar(
                    t('Failed to set paused replicas for {{name}}: {{error}}', {
                      name: resource.metadata.name,
                      error: formatError(error),
                    }),
                    { variant: 'error' }
                  );
                });
            }}
            variant="contained"
          >
            {t('Apply')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function ResumeScalingAction({ resource }: { resource: KubeObject }) {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  if (!resource || (!isPaused(resource) && !hasPausedReplicas(resource))) {
    return null;
  }

  return (
    <ActionButton
      description={t('Resume Scaling')}
      icon="mdi:play"
      onClick={() => {
        patchAnnotations(resource, {
          [PAUSED_ANNOTATION]: null,
          [PAUSED_REPLICAS_ANNOTATION]: null,
        })
          .then(response => {
            if (
              !response.metadata.annotations?.[PAUSED_ANNOTATION] &&
              !response.metadata.annotations?.[PAUSED_REPLICAS_ANNOTATION]
            ) {
              enqueueSnackbar(
                t('Successfully resumed scaling for {{name}}', { name: resource.metadata.name }),
                { variant: 'success' }
              );
            } else {
              enqueueSnackbar(
                t('Failed to resume scaling for {{name}}', { name: resource.metadata.name }),
                { variant: 'error' }
              );
            }
          })
          .catch(error => {
            enqueueSnackbar(
              t('Failed to resume scaling for {{name}}: {{error}}', {
                name: resource.metadata.name,
                error: formatError(error),
              }),
              { variant: 'error' }
            );
          });
      }}
    />
  );
}
