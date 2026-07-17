import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { Order } from '../../resources/order';
import { NotInstalledBanner } from '../common/CommonComponents';

export function OrdersList() {
  const { t } = useTranslation();
  const { isManagerInstalled, isCertManagerCheckLoading } = useCertManagerInstalled();

  return isManagerInstalled ? (
    <ResourceListView
      title={t('Orders')}
      resourceClass={Order}
      columns={[
        'name',
        'namespace',
        {
          id: 'state',
          label: t('State'),
          getValue: order => order.status?.state,
        },
        'age',
      ]}
    />
  ) : (
    <NotInstalledBanner isLoading={isCertManagerCheckLoading} />
  );
}
