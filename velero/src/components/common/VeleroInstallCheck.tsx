import { Box, CircularProgress, Grid, Link as MuiLink, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { useVeleroInstalled } from '../../hooks/useVeleroInstalled';

const LEARN_MORE_URL = 'https://github.com/kubernetes-sigs/headlamp/issues/5198';

function NotInstalledBanner({ isLoading }: { isLoading: boolean }) {
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
          <Typography variant="h5">Velero was not detected on this cluster</Typography>
        </Grid>
        <Grid item>
          <Typography>
            Install Velero to view schedules, backups, and restores here.{' '}
            <MuiLink href={LEARN_MORE_URL} target="_blank" rel="noopener noreferrer">
              Learn more
            </MuiLink>
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

/** Gates Phase 2 pages until the Velero API group is available. */
export function VeleroInstallCheck({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { installed, loading } = useVeleroInstalled();

  if (installed !== true) {
    return <>{fallback ?? <NotInstalledBanner isLoading={loading} />}</>;
  }

  return <>{children}</>;
}
