import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { Certificate } from '../../resources/certificate';
import { NotInstalledBanner, SecretNameLink } from '../common/CommonComponents';
import { CertificateExpiryLabel } from './CertificateExpiryLabel';

export function CertificatesList() {
  const { t } = useTranslation();
  const { isManagerInstalled, isCertManagerCheckLoading } = useCertManagerInstalled();

  return isManagerInstalled ? (
    <ResourceListView
      title={t('Certificates')}
      resourceClass={Certificate}
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
          sort: (a, b) => {
            const dateA = Date.parse(a.status?.notAfter || '');
            const dateB = Date.parse(b.status?.notAfter || '');
            return (
              (Number.isNaN(dateA) ? Number.POSITIVE_INFINITY : dateA) -
              (Number.isNaN(dateB) ? Number.POSITIVE_INFINITY : dateB)
            );
          },
        },
        'age',
      ]}
    />
  ) : (
    <NotInstalledBanner isLoading={isCertManagerCheckLoading} />
  );
}
