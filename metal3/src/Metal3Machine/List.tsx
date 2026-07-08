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
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { CRDGuard } from '../common/CRDGuard';

/** Label Cluster API stamps on a Metal3Machine to record its owning cluster. */
const CLUSTER_NAME_LABEL = 'cluster.x-k8s.io/cluster-name';

/** Defines the Metal3Machine custom resource (group/version/kind) for the plugin. */
export function metal3MachineClass() {
  const group = 'infrastructure.cluster.x-k8s.io';
  const version = 'v1beta2';
  const Metal3Machine = makeCustomResourceClass({
    apiInfo: [{ group, version }],
    kind: 'Metal3Machine',
    pluralName: 'metal3machines',
    singularName: 'Metal3Machine',
    isNamespaced: true,
  });

  // Links the Name column to the detail route; the resource's name and
  // namespace are passed as route params.
  return class extendedMetal3MachineClass extends Metal3Machine {
    static get detailsRoute() {
      return 'metal3machine-detail';
    }
  };
}

/** List view for Metal3Machine resources, guarded by CRD presence. */
export function Metal3Machines() {
  return (
    <CRDGuard
      crdName="metal3machines.infrastructure.cluster.x-k8s.io"
      resourceLabel="Metal3 Machine"
    >
      <ResourceListView
        title="Metal3 Machines"
        resourceClass={metal3MachineClass()}
        columns={[
          'name',
          'namespace',
          {
            // status.initialization.provisioned is the v1beta2 readiness signal,
            // replacing the v1beta1 status.ready boolean.
            id: 'provisioned',
            label: 'Provisioned',
            // An absent status.initialization.provisioned (no controller yet) is
            // Unknown, which is distinct from an explicit false.
            getValue: (m: KubeObject) => {
              const provisioned = m.jsonData.status?.initialization?.provisioned;
              return provisioned === undefined ? 'Unknown' : provisioned ? 'Yes' : 'No';
            },
            render: (m: KubeObject) => {
              const provisioned = m.jsonData.status?.initialization?.provisioned;
              const label = provisioned === undefined ? 'Unknown' : provisioned ? 'Yes' : 'No';
              // Yes is a success; an explicit No is a warning; Unknown stays neutral.
              const status =
                provisioned === true ? 'success' : provisioned === false ? 'warning' : '';
              return <StatusLabel status={status}>{label}</StatusLabel>;
            },
          },
          {
            id: 'providerID',
            label: 'Provider ID',
            getValue: (m: KubeObject) => m.jsonData.spec?.providerID || '-',
          },
          {
            id: 'cluster',
            label: 'Cluster',
            getValue: (m: KubeObject) => m.jsonData.metadata?.labels?.[CLUSTER_NAME_LABEL] || '-',
          },
          'age',
        ]}
      />
    </CRDGuard>
  );
}
