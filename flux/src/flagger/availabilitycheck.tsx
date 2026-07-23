import { K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Loader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Link, Typography } from '@mui/material';
export default function FlaggerAvailabilityCheck({ children }) {
  const { t } = useTranslation();
  const [canary, error] = useCanary();

  if (canary === null && !error) {
    return <Loader title="" />; // Loading state
  }

  if (!canary || error) {
    return (
      <Box
        title={t('Flagger Not Installed')}
        sx={{
          padding: '1rem',
          alignItems: 'center',
          margin: '2rem auto',
          maxWidth: '600px',
        }}
      >
        <h2>{t('Flagger is not installed')}</h2>
        <Typography variant="body1">
          {t('Follow the')}{' '}
          <Link
            target="_blank"
            href="https://docs.flagger.app/install/flagger-install-on-kubernetes"
          >
            {t('installation guide')}
          </Link>{' '}
          {t('to install flagger on your cluster')}
        </Typography>
      </Box>
    );
  }

  return children;
}

export function useCanary() {
  const [canary, error] =
    K8s.ResourceClasses.CustomResourceDefinition.useGet('canaries.flagger.app');
  return [canary, error];
}
