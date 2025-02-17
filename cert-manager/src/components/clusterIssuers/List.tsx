import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { ClusterIssuer } from '../../resources/clusterIssuer';
import { NotInstalledBanner } from '../common/CommonComponents';

export function ClusterIssuersList() {
  const { isManagerInstalled, isCertManagerCheckLoading } = useCertManagerInstalled();

  return isManagerInstalled ? (
    <ResourceListView
      title="Cluster Issuers"
      resourceClass={ClusterIssuer}
      columns={[
        'name',
        {
          id: 'status',
          label: 'Status',
          getValue: item => item.status?.conditions?.[0]?.status,
        },
        'age',
      ]}
    />
  ) : (
    <NotInstalledBanner isLoading={isCertManagerCheckLoading} />
  );
}
