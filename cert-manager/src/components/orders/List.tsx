import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Order } from '../../types/order';

export function OrdersList() {
  return (
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
  );
}
