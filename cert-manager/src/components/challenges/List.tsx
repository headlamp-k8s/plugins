import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { Challenge } from '../../resources/challenge';
import { NotInstalledBanner } from '../common/CommonComponents';

export function ChallengesList() {
  const { t } = useTranslation();
  const { isManagerInstalled, isCertManagerCheckLoading } = useCertManagerInstalled();

  return isManagerInstalled ? (
    <ResourceListView
      title={t('Challenges')}
      resourceClass={Challenge}
      columns={[
        'name',
        'namespace',
        {
          id: 'state',
          label: t('State'),
          getValue: item => item.status?.state,
        },
        {
          id: 'domain',
          label: t('Domain'),
          getValue: item => item.spec.dnsName,
        },
        'age',
      ]}
    />
  ) : (
    <NotInstalledBanner isLoading={isCertManagerCheckLoading} />
  );
}
