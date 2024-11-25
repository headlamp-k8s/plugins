import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Certificate } from '../../types/certificate';

export function CertificatesList() {
  return (
    <ResourceListView
      title="Certificates"
      resourceClass={Certificate}
      columns={[
        'name',
        'namespace',
        {
          id: 'ready',
          label: 'Ready',
          getValue: certificate => (certificate.ready ? 'Ready' : 'Not Ready'),
        },
        {
          id: 'secret',
          label: 'Secret',
          getValue: certificate => certificate.spec.secretName,
        },
        'age',
      ]}
    />
  );
}
