import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { Challenge } from '../../resources/challenge';
import { NotInstalledBanner } from '../common/CommonComponents';

export function ChallengesList() {
  const { isManagerInstalled, isCertManagerCheckLoading } = useCertManagerInstalled();

  return isManagerInstalled ? (
    <ResourceListView
      title="Challenges"
      resourceClass={Challenge}
      columns={[
        'name',
        'namespace',
        {
          id: 'state',
          label: 'State',
          getValue: item => item.status?.state,
        },
        {
          id: 'domain',
          label: 'Domain',
          getValue: item => item.spec.dnsName,
        },
        'age',
      ]}
    />
  ) : (
    <NotInstalledBanner isLoading={isCertManagerCheckLoading} />
  );
}
