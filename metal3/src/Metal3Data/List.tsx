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

/** Defines the Metal3Data custom resource (group/version/kind) for the plugin. */
export function metal3DataClass() {
  const group = 'infrastructure.cluster.x-k8s.io';
  const version = 'v1beta2';
  const Metal3Data = makeCustomResourceClass({
    apiInfo: [{ group, version }],
    kind: 'Metal3Data',
    pluralName: 'metal3datas',
    singularName: 'Metal3Data',
    isNamespaced: true,
  });

  return class extendedMetal3DataClass extends Metal3Data {
    static get detailsRoute() {
      return 'metal3data-detail';
    }
  };
}

/** List view for Metal3Data resources, guarded by CRD presence. */
export function Metal3Datas() {
  return (
    <CRDGuard crdName="metal3datas.infrastructure.cluster.x-k8s.io" resourceLabel="Metal3 Data">
      <ResourceListView
        title="Metal3 Data"
        resourceClass={metal3DataClass()}
        columns={[
          'name',
          'namespace',
          {
            id: 'ready',
            label: 'Ready',
            // An absent status.ready (no controller yet) is Unknown, which is
            // distinct from an explicit false.
            getValue: (d: KubeObject) => {
              const ready = d.jsonData.status?.ready;
              return ready === undefined ? 'Unknown' : ready ? 'Yes' : 'No';
            },
            render: (d: KubeObject) => {
              const ready = d.jsonData.status?.ready;
              const label = ready === undefined ? 'Unknown' : ready ? 'Yes' : 'No';
              // Yes is a success; an explicit No is a warning; Unknown stays neutral.
              const status = ready === true ? 'success' : ready === false ? 'warning' : '';
              return <StatusLabel status={status}>{label}</StatusLabel>;
            },
          },
          {
            id: 'index',
            label: 'Index',
            getValue: (d: KubeObject) =>
              d.jsonData.spec?.index === undefined ? '-' : String(d.jsonData.spec.index),
          },
          'age',
        ]}
      />
    </CRDGuard>
  );
}
