import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { Issuer } from '../../resources/issuer';
import { NotInstalledBanner } from '../common/CommonComponents';

export function IssuersList() {
  const { t } = useTranslation();
  const { isManagerInstalled, isCertManagerCheckLoading } = useCertManagerInstalled();

  return isManagerInstalled ? (
    <ResourceListView
      title={t('Issuers')}
      resourceClass={Issuer}
      columns={[
        'name',
        'namespace',
        {
          id: 'ready',
          label: t('Ready'),
          getValue: issuer => (issuer.ready ? t('Ready') : t('Not Ready')),
        },
        'age',
      ]}
    />
  ) : (
    <NotInstalledBanner isLoading={isCertManagerCheckLoading} />
  );
}
