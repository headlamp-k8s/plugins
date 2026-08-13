/*
 * Copyright 2026 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Link,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { CRDGuard } from '../common/CRDGuard';
import { bareMetalHostClass } from './List';

/** Bytes as a short size string, terabytes when large, gigabytes otherwise. */
function formatBytes(bytes?: number): string {
  if (!bytes) {
    return '-';
  }
  return bytes >= 1e12 ? `${(bytes / 1e12).toFixed(1)} TB` : `${Math.round(bytes / 1e9)} GB`;
}

/**
 * Detail view for a single BareMetalHost.
 *
 * `DetailsGrid` renders the standard metadata and the Events section; the
 * `extraInfo` callback supplies the BareMetalHost-specific fields.
 *
 * @param props.name - Host name; falls back to the `:name` route param.
 * @param props.namespace - Host namespace; falls back to the `:namespace` route param.
 */
export function BareMetalHostDetail(props: { name?: string; namespace?: string }) {
  const params = useParams<{ name: string; namespace: string }>();
  const { name = params.name, namespace = params.namespace } = props;

  return (
    <CRDGuard crdName="baremetalhosts.metal3.io" resourceLabel="Bare Metal Host">
      <DetailsGrid
        resourceType={bareMetalHostClass()}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={(item: any) =>
          item && [
            // operationalStatus is the primary health signal for a BareMetalHost;
            // provisioning state is secondary.
            {
              name: 'Operational Status',
              value: item.jsonData.status?.operationalStatus || 'Unknown',
            },
            {
              name: 'Provisioning State',
              value: item.jsonData.status?.provisioning?.state || 'Unknown',
            },
            {
              name: 'Error',
              value: item.jsonData.status?.errorMessage || '-',
            },
            {
              name: 'Consumer',
              value: (() => {
                const ref = item.jsonData.spec?.consumerRef;
                if (!ref) {
                  return '-';
                }
                const label = `${ref.name} (${ref.kind})`;
                // Link to the Metal3Machine detail when the consumer is one; other
                // consumer kinds fall back to plain text.
                return ref.kind === 'Metal3Machine' ? (
                  <Link
                    routeName="metal3machine-detail"
                    params={{ namespace: ref.namespace || namespace, name: ref.name }}
                  >
                    {label}
                  </Link>
                ) : (
                  label
                );
              })(),
            },
            {
              name: 'Power State',
              value:
                item.jsonData.status?.poweredOn === undefined
                  ? 'Unknown'
                  : item.jsonData.status.poweredOn
                  ? 'On'
                  : 'Off',
            },
            {
              name: 'Online',
              value: String(item.jsonData.spec?.online ?? false),
            },
            {
              name: 'Boot MAC Address',
              value: item.jsonData.spec?.bootMACAddress || '-',
            },
            {
              name: 'BMC Address',
              value: item.jsonData.spec?.bmc?.address || '-',
            },
          ]
        }
        extraSections={(item: any) => {
          const hw = item?.jsonData?.status?.hardware;
          if (!hw) {
            return [];
          }
          const cpu = hw.cpu ?? {};
          const vendor = hw.systemVendor;
          return [
            <SectionBox title="Hardware" key="metal3-hardware">
              <NameValueTable
                rows={[
                  {
                    name: 'CPU',
                    value: cpu.model
                      ? `${cpu.model} (${cpu.count ?? '?'} cores, ${cpu.arch ?? '?'})`
                      : '-',
                  },
                  {
                    name: 'Memory',
                    value: hw.ramMebibytes ? `${Math.round(hw.ramMebibytes / 1024)} GiB` : '-',
                  },
                  {
                    name: 'System',
                    value: vendor
                      ? `${vendor.manufacturer ?? ''} ${vendor.productName ?? ''}`.trim() || '-'
                      : '-',
                  },
                ]}
              />
            </SectionBox>,
            hw.storage?.length ? (
              <SectionBox title="Storage" key="metal3-storage">
                <SimpleTable
                  columns={[
                    { label: 'Disk', getter: (d: any) => d.name || '-' },
                    { label: 'Model', getter: (d: any) => d.model || '-' },
                    { label: 'Size', getter: (d: any) => formatBytes(d.sizeBytes) },
                    { label: 'Type', getter: (d: any) => (d.rotational ? 'HDD' : 'SSD') },
                  ]}
                  data={hw.storage}
                />
              </SectionBox>
            ) : null,
            hw.nics?.length ? (
              <SectionBox title="Network" key="metal3-network">
                <SimpleTable
                  columns={[
                    { label: 'NIC', getter: (n: any) => n.name || '-' },
                    { label: 'MAC', getter: (n: any) => n.mac || '-' },
                    { label: 'IP', getter: (n: any) => n.ip || '-' },
                    {
                      label: 'Speed',
                      getter: (n: any) => (n.speedGbps ? `${n.speedGbps} Gbps` : '-'),
                    },
                    { label: 'PXE', getter: (n: any) => (n.pxe ? 'Yes' : 'No') },
                  ]}
                  data={hw.nics}
                />
              </SectionBox>
            ) : null,
          ].filter(Boolean);
        }}
      />
    </CRDGuard>
  );
}
