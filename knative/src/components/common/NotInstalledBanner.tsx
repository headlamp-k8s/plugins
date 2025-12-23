import { Box, CircularProgress, Link as MuiLink, Typography } from '@mui/material';

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
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          width: '100%',
          maxWidth: 900,
          textAlign: 'center',
        }}
      >
        <Typography variant="h5">
          Knative was not detected on your cluster. If you haven't already, please install it.
        </Typography>
        <Typography>
          Learn how to{' '}
          <MuiLink
            href="https://knative.dev/docs/install/"
            target="_blank"
            rel="noopener noreferrer"
          >
            install
          </MuiLink>{' '}
          Knative
        </Typography>
      </Box>
    </Box>
  );
}
