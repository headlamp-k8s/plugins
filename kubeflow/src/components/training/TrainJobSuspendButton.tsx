import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ActionButton, ConfirmDialog } from '@kinvolk/headlamp-plugin/lib/components/common';
import { clusterAction } from '@kinvolk/headlamp-plugin/lib/redux/clusterActionSlice';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { TrainJobClass } from '../../resources/trainJob';

/**
 * Renders the suspend or resume action for a TrainJob with confirmation.
 */
export function TrainJobSuspendButton({ item }: { item: TrainJobClass }) {
  const { t } = useTranslation('kubeflow');
  const dispatch = useDispatch<any>();
  const location = useLocation();
  const [open, setOpen] = React.useState(false);

  const nextSuspendState = !item.suspended;
  const label = item.suspended ? t('kubeflow|Resume') : t('kubeflow|Suspend');
  const verb = item.suspended ? t('kubeflow|resume') : t('kubeflow|suspend');
  const icon = item.suspended ? 'mdi:play-circle-outline' : 'mdi:pause-circle-outline';

  function handleConfirm() {
    dispatch(
      clusterAction(() => item.patch({ spec: { suspend: nextSuspendState } }), {
        startMessage: t('kubeflow|{{label}} request sent for {{name}}...', {
          label,
          name: item.metadata.name,
        }),
        cancelledMessage: t('kubeflow|{{label}} cancelled for {{name}}.', {
          label,
          name: item.metadata.name,
        }),
        successMessage: t('kubeflow|{{label}} updated for {{name}}.', {
          label,
          name: item.metadata.name,
        }),
        errorMessage: t('kubeflow|Failed to {{verb}} {{name}}.', {
          verb,
          name: item.metadata.name,
        }),
        cancelUrl: location.pathname,
        startUrl: location.pathname,
        errorUrl: location.pathname,
      })
    );
    setOpen(false);
  }

  return (
    <>
      <ActionButton description={label} icon={icon} onClick={() => setOpen(true)} />
      <ConfirmDialog
        open={open}
        title={t('kubeflow|{{label}} TrainJob', { label })}
        description={t('kubeflow|Are you sure you want to {{verb}} TrainJob {{name}}?', {
          verb,
          name: item.metadata.name,
        })}
        handleClose={() => setOpen(false)}
        confirmLabel={label}
        onConfirm={handleConfirm}
      />
    </>
  );
}
