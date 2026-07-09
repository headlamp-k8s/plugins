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
  renderUnknownValue,
} from '../common/detailHelpers';
import { getHardwareAgentID } from './helpers';

/** Controller-reported block device details from the agent attributes annotation. */
interface AgentBlockDevice {
  /** Block device name reported by the operating system. */
  name?: string;
  /** Storage controller type, when detected. */
  controllerType?: string;
  /** Drive type reported by the agent. */
  driveType?: string;
  /** Device size reported by the agent. */
  size?: string;
  /** Device model reported by the agent. */
  model?: string;
  /** Device serial number reported by the agent. */
  serialNumber?: string;
}

/** Controller-reported network interface details from the agent attributes annotation. */
interface AgentNetworkInterface {
  /** Network interface name reported by the operating system. */
  name?: string;
  /** MAC address reported by the agent. */
  mac?: string;
  /** Link speed reported by the agent. */
  speed?: string;
}

/** Parsed hardware facts collected by the Tinkerbell agent. */
interface HardwareAgentAttributes {
  /** CPU information reported by the agent. */
  cpu?: {
    /** Number of physical or logical cores reported by the agent. */
    totalCores?: number;
    /** Number of total CPU threads reported by the agent. */
    totalThreads?: number;
  };
  /** Memory information reported by the agent. */
  memory?: {
    /** Total memory reported by the agent. */
    total?: string;
    /** Usable memory reported by the agent. */
    usable?: string;
  };
  /** Block devices observed on the hardware. */
  blockDevices?: AgentBlockDevice[];
  /** Network interfaces observed on the hardware. */
  networkInterfaces?: AgentNetworkInterface[];
  /** Product or chassis details reported by the agent. */
  product?: Record<string, unknown>;
  /** BIOS details reported by the agent. */
  bios?: Record<string, unknown>;
  /** Baseboard details reported by the agent. */
  baseboard?: Record<string, unknown>;
}

/**
 * Parses controller-reported hardware attributes from annotations.
 *
 * @param item - Hardware resource to inspect.
 * @returns Parsed agent attributes or undefined when absent.
 */
function getAgentAttributes(item: Hardware): HardwareAgentAttributes | undefined {
  const attributes = item.metadata.annotations?.['tinkerbell.org/agent-attributes'];
  if (!attributes) {
    return undefined;
  }

  try {
    return JSON.parse(attributes) as HardwareAgentAttributes;
  } catch {
    return undefined;
  }
}

/**
 * Checks whether a record has data worth rendering.
 *
 * @param value - Optional object value.
 * @returns True when the object has at least one key.
 */
function hasRecord(value: Record<string, unknown> | undefined): boolean {
  return !!value && Object.keys(value).length > 0;
}

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
          ? (() => {
              const attributes = getAgentAttributes(item);

              return [
                { name: 'Agent ID', value: getHardwareAgentID(item) },
                { name: 'Hostname', value: fallback(item.spec?.metadata?.instance?.hostname) },
                {
                  name: 'Primary IP',
                  value: fallback(item.spec?.interfaces?.[0]?.dhcp?.ip?.address),
                },
                { name: 'Primary MAC', value: fallback(item.spec?.interfaces?.[0]?.dhcp?.mac) },
                {
                  name: 'Auto Enrollment',
                  value: booleanValue(item.spec?.auto?.enrollmentEnabled),
                },
                { name: 'CPU Cores', value: fallback(attributes?.cpu?.totalCores) },
                {
                  name: 'Memory',
                  value: fallback(attributes?.memory?.usable ?? attributes?.memory?.total),
                },
              ];
            })()
          : []
      }
      extraSections={item => {
        if (!item) {
          return [];
        }

        const attributes = getAgentAttributes(item);

        return [
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
          item.spec?.bmcRef && {
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
          attributes && {
            id: 'tinkerbell.hardware-agent-summary',
            section: (
              <SectionBox title="Observed Agent Attributes">
                <NameValueTable
                  rows={[
                    { name: 'CPU Cores', value: fallback(attributes.cpu?.totalCores) },
                    { name: 'CPU Threads', value: fallback(attributes.cpu?.totalThreads) },
                    { name: 'Memory Total', value: fallback(attributes.memory?.total) },
                    { name: 'Memory Usable', value: fallback(attributes.memory?.usable) },
                    { name: 'Product', value: renderUnknownValue(attributes.product) },
                    { name: 'BIOS', value: renderUnknownValue(attributes.bios) },
                  ]}
                />
              </SectionBox>
            ),
          },
          attributes?.networkInterfaces?.length && {
            id: 'tinkerbell.hardware-agent-network-interfaces',
            section: (
              <SectionBox title="Observed Network Interfaces">
                <SimpleTable
                  columns={[
                    { label: 'Name', getter: row => fallback(row.name) },
                    { label: 'MAC', getter: row => fallback(row.mac) },
                    { label: 'Speed', getter: row => fallback(row.speed) },
                  ]}
                  data={attributes.networkInterfaces}
                />
              </SectionBox>
            ),
          },
          attributes?.blockDevices?.length && {
            id: 'tinkerbell.hardware-agent-block-devices',
            section: (
              <SectionBox title="Observed Block Devices">
                <SimpleTable
                  columns={[
                    { label: 'Name', getter: row => fallback(row.name) },
                    { label: 'Size', getter: row => fallback(row.size) },
                    { label: 'Type', getter: row => fallback(row.driveType) },
                    { label: 'Controller', getter: row => fallback(row.controllerType) },
                    { label: 'Model', getter: row => fallback(row.model) },
                  ]}
                  data={attributes.blockDevices}
                />
              </SectionBox>
            ),
          },
          hasRecord(item.spec?.references) && {
            id: 'tinkerbell.hardware-references',
            section: renderRecordSection('References', item.spec?.references),
          },
          item.spec?.userData && {
            id: 'tinkerbell.hardware-user-data',
            section: renderTextSection('User Data', item.spec?.userData),
          },
          item.spec?.vendorData && {
            id: 'tinkerbell.hardware-vendor-data',
            section: renderTextSection('Vendor Data', item.spec?.vendorData),
          },
        ].filter(Boolean);
      }}
    />
  );
}
