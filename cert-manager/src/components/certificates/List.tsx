import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { Certificate } from '../../resources/certificate';
import { NotInstalledBanner } from '../common/CommonComponents';

export function CertificatesList() {
  const { isManagerInstalled, isCertManagerCheckLoading } = useCertManagerInstalled();

  return isManagerInstalled ? (
    <ResourceListView
      title="Certificates"
      resourceClass={Certificate}
      columns={[
        'name',
        'namespace',
        {
          id: 'ready',
          label: 'Ready',
          getValue: item => (item.ready ? 'Ready' : 'Not Ready'),
        },
        {
          id: 'secret',
          label: 'Secret',
          getValue: item => item.spec.secretName,
        },
        'age',
      ]}
    />
  ) : (
    <NotInstalledBanner isLoading={isCertManagerCheckLoading} />
  );
}
