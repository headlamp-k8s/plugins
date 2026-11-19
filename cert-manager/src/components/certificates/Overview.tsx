import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  Link,
  SectionBox,
  SectionFilterHeader,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Alert, Box, Card, CardContent, CircularProgress, Grid, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useCertificateClock } from '../../hooks/useCertificateClock';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { useSelectedNamespaces } from '../../hooks/useSelectedNamespaces';
import { Certificate } from '../../resources/certificate';
import { getCertificateExpiry, needsExpiryAttention } from '../../utils/certificateExpiry';
import { NotInstalledBanner } from '../common/CommonComponents';
import { CertificateExpiryLabel } from './CertificateExpiryLabel';

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }} role="group" aria-label={title}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, my: 1 }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}

export interface CertificatesOverviewProps {
  certificates: Certificate[] | null;
  certificatesError: ReturnType<typeof Certificate.useList>[1];
  isManagerInstalled: boolean | null;
  isCertManagerCheckLoading: boolean;
}

export function CertificatesOverview({
  certificates,
  certificatesError,
  isManagerInstalled,
  isCertManagerCheckLoading,
}: CertificatesOverviewProps) {
  const { t } = useTranslation();
  const now = useCertificateClock();

  const isLoading = certificates === null && !certificatesError;
  const items = certificates || [];

  const { expiringSoon, expired } = useMemo(() => {
    const expiringSoonItems = items.filter(item =>
      needsExpiryAttention(getCertificateExpiry(item.status?.notAfter, now))
    );
    return {
      expiringSoon: expiringSoonItems,
      expired: expiringSoonItems.filter(
        item => getCertificateExpiry(item.status?.notAfter, now).level === 'expired'
      ),
    };
  }, [items, now]);

  if (!isManagerInstalled) {
    return <NotInstalledBanner isLoading={isCertManagerCheckLoading} />;
  }

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="240px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>{t('Loading certificates')}</Typography>
      </Box>
    );
  }

  if (certificatesError) {
    return <Alert severity="error">{t('Failed to load certificates')}</Alert>;
  }

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <SummaryCard
            title={t('Certificates')}
            value={items.length}
            subtitle={t('Total certificates')}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SummaryCard
            title={t('Expiring soon')}
            value={expiringSoon.length}
            subtitle={t('Within 30 days or already expired')}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SummaryCard title={t('Expired')} value={expired.length} subtitle={t('Past Not After')} />
        </Grid>
      </Grid>
      <SectionBox title={t('Certificates expiring soon')}>
        <SimpleTable
          columns={[
            {
              label: t('Name'),
              getter: (item: Certificate) => (
                <Link
                  routeName={Certificate.detailsRoute}
                  params={{ namespace: item.metadata.namespace, name: item.metadata.name }}
                  activeCluster={item.cluster}
                >
                  {item.metadata.name}
                </Link>
              ),
            },
            {
              label: t('Namespace'),
              getter: (item: Certificate) => item.metadata.namespace,
            },
            {
              label: t('Expires In'),
              getter: (item: Certificate) => (
                <CertificateExpiryLabel notAfter={item.status?.notAfter} now={now} />
              ),
            },
          ]}
          data={expiringSoon}
          emptyMessage={t('No certificates expiring soon')}
        />
      </SectionBox>
    </>
  );
}

function InstalledCertificatesOverviewPage() {
  const { t } = useTranslation();
  const selectedNamespaces = useSelectedNamespaces();
  const [certificates, certificatesError] = Certificate.useList({ namespace: selectedNamespaces });

  return (
    <>
      <SectionFilterHeader title={t('Overview')} />
      <CertificatesOverview
        certificates={certificates}
        certificatesError={certificatesError}
        isManagerInstalled
        isCertManagerCheckLoading={false}
      />
    </>
  );
}

export function CertificatesOverviewPage() {
  const { isManagerInstalled, isCertManagerCheckLoading } = useCertManagerInstalled();

  if (!isManagerInstalled) {
    return <NotInstalledBanner isLoading={isCertManagerCheckLoading} />;
  }

  return <InstalledCertificatesOverviewPage />;
}
