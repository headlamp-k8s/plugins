import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { CertificateRequest } from '../../resources/certificateRequest';
import { NotInstalledBanner } from '../common/CommonComponents';

export function CertificateRequestsList() {
  const { isManagerInstalled, isCertManagerCheckLoading } = useCertManagerInstalled();

  return isManagerInstalled ? (
    <ResourceListView
      title="Certificate Requests"
      resourceClass={CertificateRequest}
      columns={[
        'name',
        'namespace',
        {
          id: 'approved',
          label: 'Approved',
          datum: 'approved',
        },
        {
          id: 'denied',
          label: 'Denied',
          datum: 'denied',
        },
        {
          id: 'ready',
          label: 'Ready',
          datum: 'ready',
        },
        {
          id: 'issuer',
          label: 'Issuer',
          getValue: item => item.spec.issuerRef.name,
        },
        {
          id: 'requester',
          label: 'Requester',
          getValue: item => item.spec.username,
        },
        'age',
      ]}
    />
  ) : (
    <NotInstalledBanner isLoading={isCertManagerCheckLoading} />
  );
}
