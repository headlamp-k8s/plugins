import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Challenge } from '../../types/challenge';

export function ChallengesList() {
  return (
    <ResourceListView
      title="Challenges"
      resourceClass={Challenge}
      columns={[
        'name',
        'namespace',
        {
          id: 'state',
          label: 'State',
          getValue: challenge => challenge.status.state,
        },
        {
          id: 'domain',
          label: 'Domain',
          getValue: challenge => challenge.spec.dnsName,
        },
        'age',
      ]}
    />
  );
}
