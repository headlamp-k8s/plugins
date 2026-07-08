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

/** Defines the Metal3MachineTemplate custom resource (group/version/kind) for the plugin. */
export function metal3MachineTemplateClass() {
  const group = 'infrastructure.cluster.x-k8s.io';
  const version = 'v1beta2';
  const Metal3MachineTemplate = makeCustomResourceClass({
    apiInfo: [{ group, version }],
    kind: 'Metal3MachineTemplate',
    pluralName: 'metal3machinetemplates',
    singularName: 'Metal3MachineTemplate',
    isNamespaced: true,
  });

  // Links the Name column to the detail route; the resource's name and
  // namespace are passed as route params.
  return class extendedMetal3MachineTemplateClass extends Metal3MachineTemplate {
    static get detailsRoute() {
      return 'metal3machinetemplate-detail';
    }
  };
}

/** List view for Metal3MachineTemplate resources, guarded by CRD presence. */
export function Metal3MachineTemplates() {
  return (
    <CRDGuard
      crdName="metal3machinetemplates.infrastructure.cluster.x-k8s.io"
      resourceLabel="Metal3 Machine Template"
    >
      <ResourceListView
        title="Metal3 Machine Templates"
        resourceClass={metal3MachineTemplateClass()}
        columns={[
          'name',
          'namespace',
          {
            // Whether machines stamped from this template reuse the same node.
            id: 'nodeReuse',
            label: 'Node Reuse',
            getValue: (t: KubeObject) => (t.jsonData.spec?.nodeReuse ? 'Yes' : 'No'),
          },
          {
            // The blueprint's image, taken from the embedded machine spec.
            id: 'image',
            label: 'Image',
            getValue: (t: KubeObject) => t.jsonData.spec?.template?.spec?.image?.url || '-',
          },
          'age',
        ]}
      />
    </CRDGuard>
  );
}
