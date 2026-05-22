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
  const dispatch = useDispatch<any>();
  const location = useLocation();
  const [open, setOpen] = React.useState(false);

  const nextSuspendState = !item.suspended;
  const label = item.suspended ? 'Resume' : 'Suspend';
  const icon = item.suspended ? 'mdi:play-circle-outline' : 'mdi:pause-circle-outline';

  function handleConfirm() {
    dispatch(
      clusterAction(() => item.patch({ spec: { suspend: nextSuspendState } }), {
        startMessage: `${label} request sent for ${item.metadata.name}...`,
        cancelledMessage: `${label} cancelled for ${item.metadata.name}.`,
        successMessage: `${label} updated for ${item.metadata.name}.`,
        errorMessage: `Failed to ${label.toLowerCase()} ${item.metadata.name}.`,
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
        title={`${label} TrainJob`}
        description={`Are you sure you want to ${label.toLowerCase()} TrainJob ${
          item.metadata.name
        }?`}
        handleClose={() => setOpen(false)}
        confirmLabel={label}
        onConfirm={handleConfirm}
      />
    </>
  );
}
