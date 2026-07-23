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
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { CRDGuard } from '../common/CRDGuard';

/** Defines the Metal3DataClaim custom resource (group/version/kind) for the plugin. */
export function metal3DataClaimClass() {
  const group = 'infrastructure.cluster.x-k8s.io';
  const version = 'v1beta2';
  const Metal3DataClaim = makeCustomResourceClass({
    apiInfo: [{ group, version }],
    kind: 'Metal3DataClaim',
    pluralName: 'metal3dataclaims',
    singularName: 'Metal3DataClaim',
    isNamespaced: true,
  });

  return class extendedMetal3DataClaimClass extends Metal3DataClaim {
    static get detailsRoute() {
      return 'metal3dataclaim-detail';
    }
  };
}

/** List view for Metal3DataClaim resources, guarded by CRD presence. */
export function Metal3DataClaims() {
  return (
    <CRDGuard
      crdName="metal3dataclaims.infrastructure.cluster.x-k8s.io"
      resourceLabel="Metal3 Data Claim"
    >
      <ResourceListView
        title="Metal3 Data Claims"
        resourceClass={metal3DataClaimClass()}
        columns={[
          'name',
          'namespace',
          {
            // The Metal3Data this claim was bound to, once rendered.
            id: 'renderedData',
            label: 'Rendered Data',
            getValue: (c: KubeObject) => c.jsonData.status?.renderedData?.name || '-',
          },
          'age',
        ]}
      />
    </CRDGuard>
  );
}
