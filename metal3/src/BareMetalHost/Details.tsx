/*
 * Copyright 2025 The Kubernetes Authors
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
import { useParams } from 'react-router-dom';
import { CRDGuard } from '../common/CRDGuard';
import { bareMetalHostClass } from './List';

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
              value: item.jsonData.spec?.consumerRef
                ? `${item.jsonData.spec.consumerRef.name} (${item.jsonData.spec.consumerRef.kind})`
                : '-',
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
      />
    </CRDGuard>
  );
}
