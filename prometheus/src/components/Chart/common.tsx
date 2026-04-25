import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { useCluster } from '@kinvolk/headlamp-plugin/lib/k8s';
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
 * Component to display when Prometheus is not found in the cluster
 * @returns {JSX.Element}
 */
export function PrometheusNotFoundBanner() {
  const { t } = useTranslation();
  const cluster = useCluster();
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
            onClick={() => history.push(`/settings/plugins/${encodeURIComponent(PLUGIN_NAME)}`)}
          >
            {t('Configure Prometheus plugin.')}
          </Link>
        </Typography>
      </Grid>
      <Grid item>
        <Typography>
          <Link href={learnMoreLink} target="_blank">
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
