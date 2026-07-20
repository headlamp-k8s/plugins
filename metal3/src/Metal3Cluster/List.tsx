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

/** Label Cluster API stamps on a resource to record its owning cluster. */
const CLUSTER_NAME_LABEL = 'cluster.x-k8s.io/cluster-name';

/** Defines the Metal3Cluster custom resource (group/version/kind) for the plugin. */
export function metal3ClusterClass() {
  const group = 'infrastructure.cluster.x-k8s.io';
  const version = 'v1beta2';
  const Metal3Cluster = makeCustomResourceClass({
    apiInfo: [{ group, version }],
    kind: 'Metal3Cluster',
    pluralName: 'metal3clusters',
    singularName: 'Metal3Cluster',
    isNamespaced: true,
  });

  // Links the Name column to the detail route.
  return class extendedMetal3ClusterClass extends Metal3Cluster {
    static get detailsRoute() {
      return 'metal3cluster-detail';
    }
  };
}

/** List view for Metal3Cluster resources, guarded by CRD presence. */
export function Metal3Clusters() {
  return (
    <CRDGuard
      crdName="metal3clusters.infrastructure.cluster.x-k8s.io"
      resourceLabel="Metal3 Cluster"
    >
      <ResourceListView
        title="Metal3 Clusters"
        resourceClass={metal3ClusterClass()}
        columns={[
          'name',
          'namespace',
          {
            id: 'provisioned',
            label: 'Provisioned',
            // An absent status.initialization.provisioned (no controller yet) is
            // Unknown, which is distinct from an explicit false.
            getValue: (c: KubeObject) => {
              const provisioned = c.jsonData.status?.initialization?.provisioned;
              return provisioned === undefined ? 'Unknown' : provisioned ? 'Yes' : 'No';
            },
            render: (c: KubeObject) => {
              const provisioned = c.jsonData.status?.initialization?.provisioned;
              const label = provisioned === undefined ? 'Unknown' : provisioned ? 'Yes' : 'No';
              // Yes is a success; an explicit No is a warning; Unknown stays neutral.
              const status =
                provisioned === true ? 'success' : provisioned === false ? 'warning' : '';
              return <StatusLabel status={status}>{label}</StatusLabel>;
            },
          },
          {
            id: 'endpoint',
            label: 'Control Plane Endpoint',
            getValue: (c: KubeObject) => {
              const ep = c.jsonData.spec?.controlPlaneEndpoint;
              return ep?.host
                ? typeof ep.port === 'number'
                  ? `${ep.host}:${ep.port}`
                  : ep.host
                : '-';
            },
          },
          {
            id: 'cluster',
            label: 'Cluster',
            getValue: (c: KubeObject) => c.jsonData.metadata?.labels?.[CLUSTER_NAME_LABEL] || '-',
          },
          'age',
        ]}
      />
    </CRDGuard>
  );
}
