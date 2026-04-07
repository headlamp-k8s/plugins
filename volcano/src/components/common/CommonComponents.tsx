import { Box, CircularProgress, Grid, Link as MuiLink, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { useVolcanoInstalled } from '../../hooks/useVolcanoInstalled';

interface NotInstalledBannerProps {
  isLoading?: boolean;
}

export function NotInstalledBanner({ isLoading = false }: NotInstalledBannerProps) {
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
          <Typography variant="h5">
            Volcano was not detected on your cluster. If you haven&apos;t already, please install
            it.
          </Typography>
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
            Volcano
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

interface VolcanoInstallCheckProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function VolcanoInstallCheck({ children, fallback }: VolcanoInstallCheckProps) {
  const { isVolcanoInstalled, isVolcanoCheckLoading } = useVolcanoInstalled();

  if (!isVolcanoInstalled) {
    return fallback || <NotInstalledBanner isLoading={isVolcanoCheckLoading} />;
  }

  return <>{children}</>;
}
