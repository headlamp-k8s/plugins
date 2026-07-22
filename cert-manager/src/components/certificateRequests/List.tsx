import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { CertificateRequest } from '../../resources/certificateRequest';
import { NotInstalledBanner } from '../common/CommonComponents';

export function CertificateRequestsList() {
  const { t } = useTranslation();
  const { isManagerInstalled, isCertManagerCheckLoading } = useCertManagerInstalled();

  return isManagerInstalled ? (
    <ResourceListView
      title={t('Certificate Requests')}
      resourceClass={CertificateRequest}
      columns={[
        'name',
        'namespace',
        {
          id: 'approved',
          label: t('Approved'),
          datum: 'approved',
        },
        {
          id: 'denied',
          label: t('Denied'),
          datum: 'denied',
        },
        {
          id: 'ready',
          label: t('Ready'),
          datum: 'ready',
        },
        {
          id: 'issuer',
          label: t('Issuer'),
          getValue: item => item.spec.issuerRef.name,
        },
        {
          id: 'requester',
          label: t('Requester'),
          getValue: item => item.spec.username,
        },
        'age',
      ]}
    />
  ) : (
    <NotInstalledBanner isLoading={isCertManagerCheckLoading} />
  );
}
