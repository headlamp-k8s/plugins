import { useCluster } from '@kinvolk/headlamp-plugin/lib/k8s';
import { Box, Button, Grid, Link, Paper, Typography } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { useHistory } from 'react-router-dom';
import skeletonImg from '../../../assets/chart-skeleton.png';
import { disableMetrics } from '../../util';
import { formatBytes, PLUGIN_NAME } from '../../util';

const learnMoreLink = 'https://github.com/headlamp-k8s/plugins/tree/main/prometheus#readme';

const useStyles = makeStyles(theme => ({
  skeletonBox: {
    backgroundImage: `url(${skeletonImg})`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPositionX: 'center',
    height: '450px',
    color: theme.palette.common.black,
  },
  dismissButton: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
    '&:hover': {
      color: theme.palette.primary.text,
    },
  },
}));

/**
 * Component to display when Prometheus is not found in the cluster
 * @returns {JSX.Element}
 */
export function PrometheusNotFoundBanner() {
  const classes = useStyles();
  const cluster = useCluster();
  const history = useHistory();

  return (
    <Grid
      container
      spacing={2}
      direction="column"
      justifyContent="center"
      alignItems="center"
      className={classes.skeletonBox}
    >
      <Grid item>
        <Typography variant="h5">Couldn't detect Prometheus in your cluster.</Typography>
        <Typography variant="h6">
          Either configure prometheus plugin or install prometheus in your cluster.
        </Typography>
      </Grid>
      <Grid item>
        <Typography>
          <Link
            onClick={() => history.push(`/settings/plugins/${encodeURIComponent(PLUGIN_NAME)}`)}
          >
            Configure Prometheus plugin.
          </Link>
        </Typography>
      </Grid>
      <Grid item>
        <Typography>
          <Link href={learnMoreLink} target="_blank">
            Learn more about enabling advanced charts.
          </Link>
        </Typography>
      </Grid>
      <Grid item>
        <Button
          className={classes.dismissButton}
          size="small"
          variant="contained"
          onClick={() => disableMetrics(cluster)}
        >
          Dismiss
        </Button>
      </Grid>
    </Grid>
  );
}

export function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const timestamp = new Date(label * 1000); // Convert epoch to milliseconds

    return (
      <div className="custom-tooltip">
        <Paper>
          <Box p={2}>
            <p>{`Date: ${timestamp.toLocaleString()}`}</p>
            {payload.map(data => (
              <p>{`${data.name}: ${data.value}`}</p>
            ))}
          </Box>
        </Paper>
      </div>
    );
  }

  return null;
}

export function CustomTooltipFormatBytes({ active, payload, label }) {
  if (active && payload && payload.length) {
    const timestamp = new Date(label * 1000); // Convert epoch to milliseconds

    return (
      <div className="custom-tooltip">
        <Paper>
          <Box p={2}>
            <p>{`Date: ${timestamp.toLocaleString()}`}</p>
            {payload.map(data => (
              <p>{`${data.name}: ${formatBytes(data.value)}`}</p>
            ))}
          </Box>
        </Paper>
      </div>
    );
  }

  return null;
}
