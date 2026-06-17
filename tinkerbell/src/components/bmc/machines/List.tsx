import {
  type ColumnType,
  ResourceListView,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { BmcMachine } from '../../../resources/bmcMachine';
import { fallback, renderStatus } from '../../common/listHelpers';

/**
 * Renders the Tinkerbell BMC Machine list view.
 */
export function BmcMachineList() {
  const columns: (ColumnType | ResourceTableColumn<BmcMachine>)[] = [
    'name',
    'namespace',
    {
      id: 'powerState',
      label: 'Power State',
      getValue: item => fallback(item.status?.powerState),
      render: item => renderStatus(item.status?.powerState),
    },
    {
      id: 'connection',
      label: 'Connection',
      getValue: item => fallback(item.spec?.connection ? 'Configured' : undefined),
    },
    {
      id: 'conditions',
      label: 'Conditions',
      getValue: item => fallback(item.status?.conditions?.at(-1)?.type),
    },
    'age',
  ];

  return (
    <ResourceListView
      title="BMC Machines"
      resourceClass={BmcMachine}
      columns={columns}
      reflectInURL="tinkerbell-bmc-machines"
      id="tinkerbell-bmc-machines"
    />
  );
}
