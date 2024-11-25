import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { CertificateRequest } from '../../types/certificateRequest';

export function CertificateRequestsList() {
  return (
    <ResourceListView
      title="Certificate Requests"
      resourceClass={CertificateRequest}
      columns={[
        'name',
        'namespace',
        {
          id: 'approved',
          label: 'Approved',
          getValue: certificateRequest => certificateRequest.approved,
        },
        {
          id: 'denied',
          label: 'Denied',
          getValue: certificateRequest => certificateRequest.denied,
        },
        {
          id: 'ready',
          label: 'Ready',
          getValue: certificateRequest => certificateRequest.ready,
        },
        {
          id: 'issuer',
          label: 'Issuer',
          getValue: certificateRequest => certificateRequest.spec.issuerRef.name,
        },
        {
          id: 'requester',
          label: 'Requester',
          getValue: certificateRequest => certificateRequest.spec.username,
        },
        'age',
      ]}
    />
  );
}
