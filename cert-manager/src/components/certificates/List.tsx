import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Certificate } from '../../api/types';

export function CertificatesList() {
  return (
    <ResourceListView
      title="Certificates"
      resourceClass={Certificate}
      columns={['name', 'namespace']}
    />
  );
}
