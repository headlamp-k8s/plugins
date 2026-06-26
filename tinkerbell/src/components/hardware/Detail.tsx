import {
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { Hardware } from '../../resources/hardware';
import {
  booleanValue,
  fallback,
  renderRecordSection,
  renderTextSection,
  statusValue,
} from '../common/detailHelpers';

/**
 * Renders the Tinkerbell Hardware detail view.
 *
 * @returns Hardware detail page with interfaces, disks, references, and data sections.
 */
export function HardwareDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <DetailsGrid
      resourceType={Hardware}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={item =>
        item
          ? [
              { name: 'Status', value: statusValue(item.status?.state) },
              { name: 'Agent ID', value: fallback(item.spec?.agentID) },
              {
                name: 'Auto Enrollment',
                value: booleanValue(item.spec?.auto?.enrollmentEnabled),
              },
              { name: 'BMC Ref', value: fallback(item.spec?.bmcRef?.name) },
              { name: 'CPU', value: fallback(item.spec?.resources?.cpu) },
              { name: 'Memory', value: fallback(item.spec?.resources?.memory) },
              { name: 'Storage', value: fallback(item.spec?.resources?.storage) },
              { name: 'Tink Version', value: fallback(item.spec?.tinkVersion) },
            ]
          : []
      }
      extraSections={item =>
        item
          ? [
              {
                id: 'tinkerbell.hardware-interfaces',
                section: (
                  <SectionBox title="Interfaces">
                    <SimpleTable
                      columns={[
                        { label: 'MAC', getter: row => fallback(row.dhcp?.mac) },
                        { label: 'Hostname', getter: row => fallback(row.dhcp?.hostname) },
                        { label: 'IP Address', getter: row => fallback(row.dhcp?.ip?.address) },
                        { label: 'Gateway', getter: row => fallback(row.dhcp?.ip?.gateway) },
                        { label: 'Netmask', getter: row => fallback(row.dhcp?.ip?.netmask) },
                        { label: 'Arch', getter: row => fallback(row.dhcp?.arch) },
                        { label: 'UEFI', getter: row => booleanValue(row.dhcp?.uefi) },
                        { label: 'PXE', getter: row => booleanValue(row.netboot?.allowPXE) },
                        {
                          label: 'Workflow Boot',
                          getter: row => booleanValue(row.netboot?.allowWorkflow),
                        },
                      ]}
                      data={item.spec?.interfaces ?? []}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'tinkerbell.hardware-disks',
                section: (
                  <SectionBox title="Disks">
                    <SimpleTable
                      columns={[
                        { label: 'Device', getter: row => fallback(row.device) },
                        { label: 'Wipe Table', getter: row => booleanValue(row.wipeTable) },
                      ]}
                      data={item.spec?.disks ?? []}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'tinkerbell.hardware-bmc-ref',
                section: (
                  <SectionBox title="BMC Reference">
                    <NameValueTable
                      rows={[
                        { name: 'Name', value: fallback(item.spec?.bmcRef?.name) },
                        { name: 'Namespace', value: fallback(item.spec?.bmcRef?.namespace) },
                        { name: 'Kind', value: fallback(item.spec?.bmcRef?.kind) },
                        { name: 'API Group', value: fallback(item.spec?.bmcRef?.apiGroup) },
                      ]}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'tinkerbell.hardware-conditions',
                section: <ConditionsSection resource={item.jsonData} />,
              },
              {
                id: 'tinkerbell.hardware-metadata',
                section: renderRecordSection('Hardware Metadata', item.spec?.metadata),
              },
              {
                id: 'tinkerbell.hardware-references',
                section: renderRecordSection('References', item.spec?.references),
              },
              {
                id: 'tinkerbell.hardware-user-data',
                section: renderTextSection('User Data', item.spec?.userData),
              },
              {
                id: 'tinkerbell.hardware-vendor-data',
                section: renderTextSection('Vendor Data', item.spec?.vendorData),
              },
            ]
          : []
      }
    />
  );
}
