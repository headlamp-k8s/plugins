import { K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Button, Grid, Link, Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useHistory } from 'react-router-dom';
import skeletonImg from '../../../assets/chart-skeleton.png';
import { disableMetrics } from '../../util';
import { formatBytes, PLUGIN_NAME } from '../../util';

const learnMoreLink = 'https://github.com/headlamp-k8s/plugins/tree/main/prometheus#readme';

const StyledGrid = styled(Grid)(({ theme }) => ({
  backgroundImage: `url(${skeletonImg})`,
  backgroundSize: 'contain',
  backgroundRepeat: 'no-repeat',
  backgroundPositionX: 'center',
  height: '450px',
  color: theme.palette.common.black,
}));

const DismissButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.common.black,
  color: theme.palette.common.white,
  '&:hover': {
    color: theme.palette.primary.text,
  },
}));

/**
 * Says that Prometheus was not found, with links to set it up and a button that turns metrics off
 * for that cluster.
 *
 * @param props - The cluster that Prometheus was not found in.
 * @returns The banner.
 */
export function PrometheusNotFoundBanner(props: {
  /** The cluster whose metrics Dismiss turns off, when it is not the current one. */
  cluster?: string;
}) {
  const { t } = useTranslation();
  const currentCluster = K8s.useCluster();
  const cluster = props.cluster || currentCluster;
  const history = useHistory();

  return (
    <StyledGrid
      container
      spacing={2}
      direction="column"
      justifyContent="center"
      alignItems="center"
    >
      <Grid item>
        <Typography variant="h5">{t("Couldn't detect Prometheus in your cluster.")}</Typography>
        <Typography variant="h6">
          {t('Either configure prometheus plugin or install prometheus in your cluster.')}
        </Typography>
      </Grid>
      <Grid item>
        <Typography>
          <Link
            component="button"
            type="button"
            onClick={() => history.push(`/settings/plugins/${encodeURIComponent(PLUGIN_NAME)}`)}
          >
            {t('Configure Prometheus plugin.')}
          </Link>
        </Typography>
      </Grid>
      <Grid item>
        <Typography>
          <Link href={learnMoreLink} target="_blank" rel="noopener noreferrer">
            {t('Learn more about enabling advanced charts.')}
          </Link>
        </Typography>
      </Grid>
      <Grid item>
        <DismissButton size="small" variant="contained" onClick={() => disableMetrics(cluster)}>
          {t('Dismiss')}
        </DismissButton>
      </Grid>
    </StyledGrid>
  );
}

export function CustomTooltip({ active, payload, label }) {
  const { t } = useTranslation();
  if (active && payload && payload.length) {
    const timestamp = new Date(label * 1000); // Convert epoch to milliseconds

    return (
      <Paper variant="outlined" sx={{ p: 0.5, opacity: 0.8 }}>
        <b>{t('Date: {{ date }}', { date: timestamp.toLocaleString() })}</b>
        {payload.map(data => (
          <div>{`${data.name}: ${data.value}`}</div>
        ))}
      </Paper>
    );
  }

  return null;
}

export function CustomTooltipFormatBytes({ active, payload, label }) {
  const { t } = useTranslation();
  if (active && payload && payload.length) {
    const timestamp = new Date(label * 1000); // Convert epoch to milliseconds

    return (
      <Paper variant="outlined" sx={{ p: 0.5, opacity: 0.8 }}>
        <b>{t('Date: {{ date }}', { date: timestamp.toLocaleString() })}</b>
        {payload.map(data => (
          <div>{`${data.name}: ${formatBytes(data.value)}`}</div>
        ))}
      </Paper>
    );
  }

  return null;
}
