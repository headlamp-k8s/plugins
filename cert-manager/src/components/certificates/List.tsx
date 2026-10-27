import { K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { Certificate } from '../../resources/certificate';
import { NotInstalledBanner } from '../common/CommonComponents';
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
          render: item => {
            const secretName = item.spec?.secretName;
            const namespace = item.metadata?.namespace;
            if (!secretName) {
              return '-';
            }
            return namespace ? (
              <Link
                routeName={K8s.ResourceClasses.Secret.kind}
                params={{ name: secretName, namespace }}
                activeCluster={item.cluster}
              >
                {secretName}
              </Link>
            ) : (
              secretName
            );
          },
          getValue: item => item.spec?.secretName ?? '',
        },
        {
          id: 'expiresIn',
          label: t('Expires In (Not After)'),
          render: item => <CertificateExpiryLabel notAfter={item?.status?.notAfter} />,
          getValue: item => item.status?.notAfter ?? '',
          sort: (a, b) => {
            const dateA = a.status?.notAfter ? new Date(a.status.notAfter).getTime() : 0;
            const dateB = b.status?.notAfter ? new Date(b.status.notAfter).getTime() : 0;
            return dateA - dateB;
          },
        },
        'age',
      ]}
    />
  ) : (
    <NotInstalledBanner isLoading={isCertManagerCheckLoading} />
  );
}
