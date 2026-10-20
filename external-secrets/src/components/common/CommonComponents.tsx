import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, CircularProgress, Grid, Link as MuiLink, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { useESOInstalled } from '../../hooks/useESOInstalled';
import { ExternalSecretData, ExternalSecretDataFrom } from '../../resources/externalSecretTypes';

interface NotInstalledBannerProps {
  isLoading?: boolean;
}

export function NotInstalledBanner({ isLoading = false }: NotInstalledBannerProps) {
  const { t } = useTranslation();

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
            {t(
              "External Secrets Operator was not detected on your cluster. If you haven't already, please install it."
            )}
          </Typography>
        </Grid>
        <Grid item>
          <Typography>
            {t('Learn how to')}{' '}
            <MuiLink
              href="https://external-secrets.io/latest/introduction/getting-started/"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('install')}
            </MuiLink>{' '}
            {t('External Secrets Operator')}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

interface ESOInstallCheckProps {
  children: ReactNode;
}

export function ESOInstallCheck({ children }: ESOInstallCheckProps) {
  const { isESOInstalled, isESOCheckLoading } = useESOInstalled();

  if (isESOCheckLoading) {
    return <NotInstalledBanner isLoading />;
  }

  if (!isESOInstalled) {
    return <NotInstalledBanner />;
  }

  return <>{children}</>;
}

interface ReadyStatusLabelProps {
  ready: boolean;
  reason?: string;
}

export function ReadyStatusLabel({ ready, reason }: ReadyStatusLabelProps) {
  const { t } = useTranslation();

  return (
    <StatusLabel status={ready ? 'success' : 'error'}>
      {ready ? t('Ready') : reason || t('Not Ready')}
    </StatusLabel>
  );
}

interface SecretDataSectionProps {
  data?: ExternalSecretData[];
  dataFrom?: ExternalSecretDataFrom[];
}

/**
 * Shows how provider entries map onto keys of the target Secret: one row per
 * spec.data entry, plus one row per spec.dataFrom bulk entry.
 */
export function SecretDataSection({ data = [], dataFrom = [] }: SecretDataSectionProps) {
  const { t } = useTranslation();

  const rows = [
    ...data.map(entry => ({
      secretKey: entry.secretKey,
      remoteRef: entry.remoteRef.property
        ? `${entry.remoteRef.key} (${entry.remoteRef.property})`
        : entry.remoteRef.key,
    })),
    ...dataFrom.map(entry => ({
      secretKey: t('(all extracted keys)'),
      remoteRef: entry.extract?.key || entry.find?.path || entry.find?.name?.regexp || '-',
    })),
  ];

  return (
    <SectionBox title={t('Data')}>
      {rows.length === 0 ? (
        <Typography sx={{ py: 2 }} color="textSecondary">
          {t('No data mappings defined.')}
        </Typography>
      ) : (
        <SimpleTable
          columns={[
            {
              label: t('Target Secret Key'),
              getter: row => row.secretKey,
            },
            {
              label: t('Remote Reference'),
              getter: row => row.remoteRef,
            },
          ]}
          data={rows}
        />
      )}
    </SectionBox>
  );
}
