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

import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { CRDGuard } from '../common/CRDGuard';
import { composeStatus, HostStatusLabel } from './HostStatusLabel';

/** Defines the BareMetalHost custom resource (group/version/kind) for the plugin. */
export function bareMetalHostClass() {
  const group = 'metal3.io';
  const version = 'v1alpha1';
  const BareMetalHost = makeCustomResourceClass({
    apiInfo: [{ group, version }],
    kind: 'BareMetalHost',
    pluralName: 'baremetalhosts',
    singularName: 'BareMetalHost',
    isNamespaced: true,
  });

  // Links the Name column to the detail route; the resource's name and
  // namespace are passed as route params.
  return class extendedBareMetalHostClass extends BareMetalHost {
    static get detailsRoute() {
      return 'baremetalhost-detail';
    }
  };
}

/** List view for BareMetalHost resources, guarded by CRD presence. */
export function BareMetalHosts() {
  return (
    <CRDGuard crdName="baremetalhosts.metal3.io" resourceLabel="Bare Metal Host">
      <ResourceListView
        title="Bare Metal Hosts"
        resourceClass={bareMetalHostClass()}
        columns={[
          'name',
          'namespace',
          {
            // Composite status: operational status (headline) combined with
            // provisioning state and any error type. getValue sorts on the
            // operational status; render shows the full composite cell.
            id: 'status',
            label: 'Status',
            getValue: (bmh: KubeObject) => composeStatus(bmh.jsonData).operationalStatus || '-',
            render: (bmh: KubeObject) => <HostStatusLabel host={bmh} />,
          },
          'age',
        ]}
      />
    </CRDGuard>
  );
}
