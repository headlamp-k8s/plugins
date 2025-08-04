import { Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useClustersConf } from '@kinvolk/headlamp-plugin/lib/k8s';
import { Alert, Card } from '@mui/material';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import React from 'react';
import { useHistory } from 'react-router-dom';
import DriverSelect from './DriverSelect';
import { useInfo } from './useInfo';

export interface CommandDialogProps {
  /** Is the dialog open? */
  open: boolean;
  /** Function to call when the dialog is closed */
  onClose: () => void;
  /** Function to call when the user confirms the action */
  onConfirm: (data: { clusterName: string; driver: string }) => void;
  /** Command to run, like stop, start, delete... */
  command: string;
  /** The title of the form */
  title?: string;
  /** Is the command about to run? */
  acting: boolean;
  /** Command is actually running. There is some time before running where it can still be cancelled. */
  running: boolean;
  /** Output lines coming from the command. */
  actingLines?: string[];
  /** Is the command done? */
  commandDone: boolean;
  /** should it use a dialog or use a grid? */
  useGrid?: boolean;
  /** The cluster context to act on */
  initialClusterName?: string;
  /** Ask for the cluster name. Otherwise the initialClusterName is used. */
  askClusterName?: boolean;
}

/**
 * A form to confirm a command on a cluster.
 */
export default function CommandDialog({
  open,
  onClose,
  onConfirm,
  command,
  title,
  acting,
  running,
  actingLines,
  commandDone,
  useGrid,
  initialClusterName,
  askClusterName,
}: CommandDialogProps) {
  const [clusterName, setClusterName] = React.useState(initialClusterName || '');
  const [driver, setDriver] = React.useState<string | null>(null);
  const [nameTaken, setNameTaken] = React.useState(false);
  const info = useInfo();

  const history = useHistory();
  const clusters = useClustersConf() || {};
  const clusterNames = Object.keys(clusters);

  React.useEffect(() => {
    if (open && !initialClusterName && askClusterName) {
      setClusterName(generateClusterName(clusterNames));
    }
    // Only generate a new name when dialog is opened, not on every clusterNames change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialClusterName, askClusterName]);

  function generateClusterName(existingNames: string[]): string {
    const baseName = 'minikube';
    let newName = baseName;
    let counter = 1;

    while (existingNames.includes(newName)) {
      newName = `${baseName}-${counter}`;
      counter++;
    }

    return newName;
  }

  if (acting && open && !running) {
    if (askClusterName) {
      return <Loader title={`Loading data for ${title}`} />;
    } else {
      return null;
    }
  }

  const content = (
    <>
      {!askClusterName && !acting && (
        <Typography>
          {`Are you sure you want to "${command}" the cluster "${clusterName}"?`}
        </Typography>
      )}

      {askClusterName && !acting && (
        <>
          <FormControl fullWidth>
            <Box pt={2}>
              <TextField
                id="cluster-name-input"
                label="Cluster Name"
                value={clusterName}
                onChange={function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
                  const name = event.target.value;
                  setClusterName(name);
                  setNameTaken(clusterNames.includes(name));
                }}
                variant="outlined"
                error={nameTaken}
                helperText={nameTaken ? 'Cluster name is already taken' : ''}
              />
            </Box>
          </FormControl>
          <DriverSelect driver={driver} setDriver={setDriver} info={info} />
          {info && parseFloat(info.freeRam) < 2 && (
            <Alert severity="warning">
              {`Warning: You have less than 2GB of free Memory available. This may affect performance.`}
            </Alert>
          )}
          {info && parseFloat(info.ram) <= 8 && (
            <Alert severity="warning">
              {`Warning: We recommend more than 8GB of Memory Total. This may affect performance.`}
            </Alert>
          )}
          {info && parseFloat(info.diskFree) < 22 && (
            <Alert severity="warning">
              {`Warning: You have less than 22GB of free Disk available. This may affect performance.`}
            </Alert>
          )}
        </>
      )}
      {acting && actingLines && Array.isArray(actingLines) && actingLines.length > 0 && (
        <Card variant="outlined" sx={{ mt: 2, p: 2 }}>
          {actingLines.map((line, index) => (
            <Typography key={index} variant="body1">
              {line}
            </Typography>
          ))}
        </Card>
      )}
      {running && !commandDone && <Loader title={`Loading data for ${title}`} />}
    </>
  );

  const waitForDriver = command === 'start' && askClusterName ? driver === null : false;

  const buttons = (
    <>
      {!acting && waitForDriver && <Loader title={`Detecting drivers...`} />}
      {!acting && !waitForDriver && (
        <>
          {!useGrid && <Button onClick={onClose}>Cancel</Button>}
          <Button
            onClick={() => {
              if (clusterName) {
                onConfirm({ clusterName, driver });
              }
            }}
            variant="contained"
            color="primary"
            disabled={nameTaken && askClusterName}
          >
            {`${command}`}
          </Button>
        </>
      )}
      {!useGrid && commandDone && (
        <>
          <Button variant="contained" color="primary" onClick={onClose}>
            Close
          </Button>
        </>
      )}
      {useGrid && commandDone && (
        // @todo:
        // Going to the Home doesn't work. Because of a bug in the way clusters are only
        // refreshed on the home page. So we can't navigate to the cluster page, as it is a 404.
        // Currently non cluster pages do not refresh the backend list of clusters.
        // That is why this link to the cluster does not work and is commented out.
        // https://github.com/headlamp-k8s/headlamp/issues/3040#issuecomment-2758929070
        // <>
        //   <Button onClick={() => {
        //     onClose();
        //     history.push(`/clusters/${clusterName}`);
        //   }}>View Cluster</Button>
        // </>
        <>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              onClose();
              history.push(`/`);
            }}
          >
            Home
          </Button>
        </>
      )}
    </>
  );

  return useGrid ? (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography>{title}</Typography>
      </Grid>
      <Grid item xs={12}>
        {content}
      </Grid>
      <Grid item xs={6}>
        {buttons}
      </Grid>
    </Grid>
  ) : (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{content}</DialogContent>
      <DialogActions>{buttons}</DialogActions>
    </Dialog>
  );
}
