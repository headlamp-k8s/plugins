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

/** Defines the Metal3DataTemplate custom resource (group/version/kind) for the plugin. */
export function metal3DataTemplateClass() {
  const group = 'infrastructure.cluster.x-k8s.io';
  const version = 'v1beta2';
  const Metal3DataTemplate = makeCustomResourceClass({
    apiInfo: [{ group, version }],
    kind: 'Metal3DataTemplate',
    pluralName: 'metal3datatemplates',
    singularName: 'Metal3DataTemplate',
    isNamespaced: true,
  });

  return class extendedMetal3DataTemplateClass extends Metal3DataTemplate {
    static get detailsRoute() {
      return 'metal3datatemplate-detail';
    }
  };
}

/** List view for Metal3DataTemplate resources, guarded by CRD presence. */
export function Metal3DataTemplates() {
  return (
    <CRDGuard
      crdName="metal3datatemplates.infrastructure.cluster.x-k8s.io"
      resourceLabel="Metal3 Data Template"
    >
      <ResourceListView
        title="Metal3 Data Templates"
        resourceClass={metal3DataTemplateClass()}
        columns={[
          'name',
          'namespace',
          {
            id: 'cluster',
            label: 'Cluster',
            getValue: (t: KubeObject) => t.jsonData.spec?.clusterName || '-',
          },
          'age',
        ]}
      />
    </CRDGuard>
  );
}
