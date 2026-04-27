import { Box, CircularProgress, Grid, Link as MuiLink, Typography } from '@mui/material';
import { ReactNode } from 'react';
import {
  useVolcanoCoreInstalled,
  useVolcanoFlowInstalled,
} from '../../hooks/useVolcanoInstallChecks';

interface NotInstalledBannerProps {
  isLoading?: boolean;
  message?: string;
  linkText?: string;
}

export function NotInstalledBanner({
  isLoading = false,
  message = "Volcano was not detected on your cluster. If you haven't already, please install it.",
  linkText = 'Volcano',
}: NotInstalledBannerProps) {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2} minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" p={2} minHeight="200px">
      <Grid container spacing={2} direction="column" justifyContent="center" alignItems="center">
        <Grid item>
          <Typography variant="h5">{message}</Typography>
        </Grid>
        <Grid item>
          <Typography>
            Learn how to{' '}
            <MuiLink
              href="https://volcano.sh/en/docs/installation/"
              target="_blank"
              rel="noopener noreferrer"
            >
              install
            </MuiLink>{' '}
            {linkText}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

interface VolcanoApiInstallCheckProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function VolcanoCoreInstallCheck({ children, fallback }: VolcanoApiInstallCheckProps) {
  const { isVolcanoCoreInstalled, isVolcanoCoreCheckLoading } = useVolcanoCoreInstalled();

  if (!isVolcanoCoreInstalled) {
    return fallback || <NotInstalledBanner isLoading={isVolcanoCoreCheckLoading} />;
  }

  return <>{children}</>;
}

export function VolcanoFlowInstallCheck({ children, fallback }: VolcanoApiInstallCheckProps) {
  const { isVolcanoFlowInstalled, isVolcanoFlowCheckLoading } = useVolcanoFlowInstalled();

  if (!isVolcanoFlowInstalled) {
    return (
      fallback || (
        <NotInstalledBanner
          isLoading={isVolcanoFlowCheckLoading}
          message="Volcano Flow API was not detected on this cluster. Install or enable the JobFlow and JobTemplate CRDs to view these resources."
          linkText="Volcano Flow"
        />
      )
    );
  }

  return <>{children}</>;
}
