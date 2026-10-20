import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { ClusterIssuer } from '../../resources/clusterIssuer';
import { NotInstalledBanner } from '../common/CommonComponents';

export function ClusterIssuersList() {
  const { t } = useTranslation();
  const { notInstalled, isLoading } = useCertManagerInstalled();

  return !notInstalled && !isLoading ? (
    <ResourceListView
      title={t('Cluster Issuers')}
      resourceClass={ClusterIssuer}
      columns={[
        'name',
        {
          id: 'status',
          label: t('Status'),
          getValue: item => item.status?.conditions?.[0]?.status,
        },
        'age',
      ]}
    />
  ) : (
    <NotInstalledBanner isLoading={isLoading} />
  );
}
