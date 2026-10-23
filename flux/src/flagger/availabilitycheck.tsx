import { K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Loader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Typography } from '@mui/material';
import { Trans } from 'react-i18next';
import { ExternalLink } from '../common/Link';

export default function FlaggerAvailabilityCheck({ children }) {
  const { t } = useTranslation();
  const [canary, error] = useCanary();

  if (canary === null && !error) {
    return <Loader title="" />; // Loading state
  }

  if (!canary || error) {
    return (
      <Box
        sx={{
          padding: '1rem',
          alignItems: 'center',
          margin: '2rem auto',
          maxWidth: '600px',
        }}
      >
        <h1>{t('Flagger is not installed')}</h1>
        <Typography variant="body1">
          <Trans
            t={t}
            i18nKey="Follow the <guide>installation guide</guide> to install flagger on your cluster"
            components={{
              guide: (
                <ExternalLink href="https://docs.flagger.app/install/flagger-install-on-kubernetes" />
              ),
            }}
          />
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
