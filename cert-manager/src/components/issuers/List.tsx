import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Issuer } from '../../types/issuer';

export function IssuersList() {
  return (
    <ResourceListView
      title="Issuers"
      resourceClass={Issuer}
      columns={[
        'name',
        'namespace',
        {
          id: 'ready',
          label: 'Ready',
          getValue: issuer => (issuer.ready ? 'Ready' : 'Not Ready'),
        },
        'age',
      ]}
    />
  );
}
