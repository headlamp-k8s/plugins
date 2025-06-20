import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Machine } from '../../resources/machine';

export function MachinesList() {
  return (
    <ResourceListView
      title="Machines"
      resourceClass={Machine}
      columns={[
        'name',
        'namespace',
        {
          id: 'nodeName',
          label: 'Node Name',
          getValue: machine => machine.status?.nodeRef?.name,
        },
        {
          id: 'providerID',
          label: 'Provider ID',
          getValue: machine => machine.spec?.providerID,
        },
        {
          id: 'phase',
          label: 'Phase',
          getValue: machine => machine.status?.phase,
        },
        'age',
      ]}
    />
  );
}
