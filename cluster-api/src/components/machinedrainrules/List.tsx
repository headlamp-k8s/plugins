import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { MachineDrainRule } from '../../resources/machinedrainrule';

export function MachineDrainRulesList() {
  return (
    <ResourceListView
      title="Machine Drain Rules"
      resourceClass={MachineDrainRule}
      columns={[
        'name',
        'namespace',
        {
          id: 'behavior',
          label: 'Behavior',
          getValue: mdr => mdr.spec.drain.behavior,
        },
        {
          id: 'order',
          label: 'Order',
          getValue: mdr => mdr.spec.drain.order,
        },
        'age',
      ]}
    />
  );
}
