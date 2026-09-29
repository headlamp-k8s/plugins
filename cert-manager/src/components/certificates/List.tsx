import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Button } from '@mui/material';
import { useMemo, useState } from 'react';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { Certificate } from '../../resources/certificate';
import { NotInstalledBanner, SecretNameLink } from '../common/CommonComponents';
import { CertificateExpiryLabel } from './CertificateExpiryLabel';

export function CertificatesList() {
  const { t } = useTranslation();
  const { isManagerInstalled, isCertManagerCheckLoading } = useCertManagerInstalled();
  const [certificates, certificatesError] = Certificate.useList();
  const [sortDescending, setSortDescending] = useState(false);

  const sortedCertificates = useMemo(() => {
    if (!certificates) {
      return null;
    }

    return [...certificates].sort((a, b) => {
      const dateA = Date.parse(a.status?.notAfter || '');
      const dateB = Date.parse(b.status?.notAfter || '');
      const invalidA = Number.isNaN(dateA);
      const invalidB = Number.isNaN(dateB);

      if (invalidA || invalidB) {
        if (invalidA && invalidB) {
          return 0;
        }
        return invalidA ? 1 : -1;
      }

      return sortDescending ? dateB - dateA : dateA - dateB;
    });
  }, [certificates, sortDescending]);

  return isManagerInstalled ? (
    <>
      <Button onClick={() => setSortDescending(value => !value)} sx={{ mb: 1 }}>
        {sortDescending ? t('Sort expiry: earliest first') : t('Sort expiry: latest first')}
      </Button>
      <ResourceListView
        title={t('Certificates')}
        data={sortedCertificates}
        errorMessage={certificatesError ? t('Failed to load certificates') : null}
        columns={[
          'name',
          'namespace',
          {
            id: 'ready',
            label: t('Ready'),
            getValue: item => (item.ready ? t('Ready') : t('Not Ready')),
          },
          {
            id: 'secret',
            label: t('Secret'),
            getValue: item => item.spec.secretName,
            render: item => (
              <SecretNameLink name={item?.spec?.secretName} namespace={item?.metadata?.namespace} />
            ),
          },
          {
            id: 'expiresIn',
            label: t('Expires In'),
            render: item => <CertificateExpiryLabel notAfter={item?.status?.notAfter} />,
            getValue: item => item.status?.notAfter ?? '',
            sort: false,
          },
          'age',
        ]}
      />
    </>
  ) : (
    <NotInstalledBanner isLoading={isCertManagerCheckLoading} />
  );
}
