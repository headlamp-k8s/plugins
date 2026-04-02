import { Icon } from '@iconify/react';
import { ActionButton, AuthVisible } from '@kinvolk/headlamp-plugin/lib/components/common';
import type { ButtonStyle } from '@kinvolk/headlamp-plugin/lib/components/common/ActionButton/ActionButton';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { clusterAction } from '@kinvolk/headlamp-plugin/lib/redux/clusterActionSlice';
import {
  EventStatus,
  HeadlampEventType,
  useEventCallback,
} from '@kinvolk/headlamp-plugin/lib/redux/headlampEventSlice';
import Button from '@mui/material/Button';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Fab from '@mui/material/Fab';
import Grid from '@mui/material/Grid';
import OutlinedInput from '@mui/material/OutlinedInput';
import { styled, useTheme } from '@mui/material/styles';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';

interface ScaleResource extends KubeObject {
  spec?: {
    replicas?: number;
  };
}

interface ScaleButtonProps {
  item: ScaleResource;
  buttonStyle?: ButtonStyle;
}

export default function ScaleButton(props: ScaleButtonProps) {
  const dispatch = useDispatch();
  const { item, buttonStyle } = props;
  const [openDialog, setOpenDialog] = React.useState(false);
  const location = useLocation();

  const applyFunc = React.useCallback((numReplicas: number) => item.scale(numReplicas), [item]);

  function handleSave(numReplicas: number) {
    const cancelUrl = location.pathname;
    const itemName = item.metadata.name;

    setOpenDialog(false);

    dispatch(
      clusterAction(() => applyFunc(numReplicas), {
        startMessage: `Scaling ${itemName}…`,
        cancelledMessage: `Cancelled scaling ${itemName}.`,
        successMessage: `Scaled ${itemName}.`,
        errorMessage: `Failed to scale ${itemName}.`,
        cancelUrl,
        errorUrl: cancelUrl,
      }) as any
    );
  }

  function handleClose() {
    setOpenDialog(false);
  }

  if (!item || !item.isScalable) {
    return null;
  }

  return (
    <AuthVisible item={item} authVerb="patch" subresource="scale">
      <ActionButton
        description="Scale"
        buttonStyle={buttonStyle}
        onClick={() => {
          setOpenDialog(true);
        }}
        icon="mdi:expand-all"
      />
      <ScaleDialog resource={item} open={openDialog} onClose={handleClose} onSave={handleSave} />
    </AuthVisible>
  );
}

interface ScaleDialogProps extends Omit<DialogProps, 'resource'> {
  resource: ScaleResource;
  onSave: (numReplicas: number) => void;
  onClose: () => void;
  errorMessage?: string;
}

const Input = styled(OutlinedInput)({
  '& input[type=number]': {
    MozAppearance: 'textfield',
    textAlign: 'center',
  },
  '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
    display: 'none',
  },
  width: '80px',
});

function ScaleDialog(props: ScaleDialogProps) {
  const { open, resource, onClose, onSave } = props;
  const initialReplicasValue = Number(resource.spec?.replicas ?? 0);
  const initialReplicas = isNaN(initialReplicasValue) ? 0 : initialReplicasValue;
  const [numReplicas, setNumReplicas] = React.useState<number>(initialReplicas);
  const theme = useTheme();
  const desiredNumReplicasLabel = 'desired-number-replicas-label';
  const numReplicasForWarning = 100;
  const dispatchHeadlampEvent = useEventCallback(HeadlampEventType.SCALE_RESOURCE);

  const currentNumReplicas = initialReplicas;

  React.useEffect(() => {
    if (open) {
      setNumReplicas(initialReplicas);
    }
  }, [open, initialReplicas]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Scale Replicas</DialogTitle>
      <DialogContent
        sx={{
          paddingBottom: '30px',
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <DialogContentText>
              {`Current number of replicas: ${currentNumReplicas}`}
            </DialogContentText>
          </Grid>
          <Grid item container alignItems="center" spacing={1}>
            <Grid item sm="auto" xs={12}>
              <DialogContentText id={desiredNumReplicasLabel}>
                Desired number of replicas:
              </DialogContentText>
            </Grid>
            <Grid
              item
              container
              sm="auto"
              sx={{ padding: '6px', textAlign: 'left', width: 'auto' }}
            >
              <Grid item>
                <Fab
                  size="small"
                  color="secondary"
                  onClick={() => setNumReplicas(numReplicas => Math.max(0, numReplicas - 1))}
                  aria-label="Decrement"
                  disabled={numReplicas <= 0}
                  sx={{ boxShadow: 'none' }}
                >
                  <Icon icon="mdi:minus" width="22px" />
                </Fab>
              </Grid>
              <Grid item>
                <Input
                  size="small"
                  type="number"
                  value={numReplicas}
                  sx={{ marginLeft: '6px', marginRight: '6px' }}
                  onChange={e => setNumReplicas(Math.max(0, Number(e.target.value)))}
                  aria-labelledby={desiredNumReplicasLabel}
                  inputProps={{
                    min: 0,
                    step: 1,
                  }}
                />
              </Grid>
              <Grid item>
                <Fab
                  size="small"
                  color="secondary"
                  onClick={() => setNumReplicas(numReplicas => numReplicas + 1)}
                  aria-label="Increment"
                  sx={{ boxShadow: 'none' }}
                >
                  <Icon icon="mdi:plus" width="22px" />
                </Fab>
              </Grid>
            </Grid>
            <Grid item xs="auto">
              {numReplicas >= numReplicasForWarning && (
                <Icon icon="mdi:warning" width="28px" color={theme.palette.warning.main} />
              )}
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" variant="contained">
          Cancel
        </Button>
        <Button
          onClick={() => {
            onSave(numReplicas);
            dispatchHeadlampEvent({
              resource: resource,
              status: EventStatus.CONFIRMED,
            });
          }}
          variant="contained"
          color="primary"
          disabled={isNaN(numReplicas) || numReplicas === initialReplicas}
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}
