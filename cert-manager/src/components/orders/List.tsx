import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { Order } from '../../resources/order';
import { NotInstalledBanner } from '../common/CommonComponents';

export function OrdersList() {
  const { isManagerInstalled, isCertManagerCheckLoading } = useCertManagerInstalled();

  return isManagerInstalled ? (
    <ResourceListView
      title="Orders"
      resourceClass={Order}
      columns={[
        'name',
        'namespace',
        {
          id: 'state',
          label: 'State',
          getValue: order => order.status?.state,
        },
        'age',
      ]}
    />
  ) : (
    <NotInstalledBanner isLoading={isCertManagerCheckLoading} />
  );
}
