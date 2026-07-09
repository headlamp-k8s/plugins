import {
  type ColumnType,
  ResourceListView,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Hardware } from '../../resources/hardware';
import {
  booleanLabel,
  countLabel,
  fallback,
  getFirstDefined,
  renderFallback,
} from '../common/listHelpers';
import { getHardwareAgentID } from './helpers';

/**
 * Renders the Tinkerbell Hardware list view.
 *
 * @returns Hardware list view with network and provisioning columns.
 */
export function HardwareList() {
  const columns: (ColumnType | ResourceTableColumn<Hardware>)[] = [
    'name',
    'namespace',
    {
      id: 'agentID',
      label: 'Agent ID',
      getValue: item => getHardwareAgentID(item),
      render: item => renderFallback(getHardwareAgentID(item)),
    },
    {
      id: 'mac',
      label: 'MAC',
      getValue: item => fallback(item.spec?.interfaces?.[0]?.dhcp?.mac),
      render: item => renderFallback(item.spec?.interfaces?.[0]?.dhcp?.mac),
    },
    {
      id: 'address',
      label: 'Address',
      getValue: item => fallback(item.spec?.interfaces?.[0]?.dhcp?.ip?.address),
      render: item => renderFallback(item.spec?.interfaces?.[0]?.dhcp?.ip?.address),
    },
    {
      id: 'hostname',
      label: 'Hostname',
      getValue: item => fallback(item.spec?.interfaces?.[0]?.dhcp?.hostname),
      render: item => renderFallback(item.spec?.interfaces?.[0]?.dhcp?.hostname),
    },
    {
      id: 'pxe',
      label: 'PXE',
      getValue: item =>
        booleanLabel(
          getFirstDefined(
            item.spec?.interfaces?.[0]?.netboot?.allowPXE,
            item.spec?.interfaces?.[0]?.netboot?.allowWorkflow
          )
        ),
    },
    {
      id: 'disks',
      label: 'Disks',
      getValue: item => countLabel(item.spec?.disks?.length, 'disk'),
    },
    'age',
  ];

  return (
    <ResourceListView
      title="Hardware"
      resourceClass={Hardware}
      columns={columns}
      reflectInURL="tinkerbell-hardware"
      id="tinkerbell-hardware"
    />
  );
}
