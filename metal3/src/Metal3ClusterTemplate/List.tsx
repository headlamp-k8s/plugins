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

/** Defines the Metal3ClusterTemplate custom resource (group/version/kind) for the plugin. */
export function metal3ClusterTemplateClass() {
  const group = 'infrastructure.cluster.x-k8s.io';
  const version = 'v1beta2';
  const Metal3ClusterTemplate = makeCustomResourceClass({
    apiInfo: [{ group, version }],
    kind: 'Metal3ClusterTemplate',
    pluralName: 'metal3clustertemplates',
    singularName: 'Metal3ClusterTemplate',
    isNamespaced: true,
  });

  return class extendedMetal3ClusterTemplateClass extends Metal3ClusterTemplate {
    static get detailsRoute() {
      return 'metal3clustertemplate-detail';
    }
  };
}

/** List view for Metal3ClusterTemplate resources, guarded by CRD presence. */
export function Metal3ClusterTemplates() {
  return (
    <CRDGuard
      crdName="metal3clustertemplates.infrastructure.cluster.x-k8s.io"
      resourceLabel="Metal3 Cluster Template"
    >
      <ResourceListView
        title="Metal3 Cluster Templates"
        resourceClass={metal3ClusterTemplateClass()}
        columns={[
          'name',
          'namespace',
          {
            // Cloud provider setting from the embedded cluster spec.
            id: 'cloudProviderEnabled',
            label: 'Cloud Provider Enabled',
            getValue: (t: KubeObject) => {
              const enabled = t.jsonData.spec?.template?.spec?.cloudProviderEnabled;
              return enabled === undefined ? '-' : enabled ? 'Yes' : 'No';
            },
          },
          'age',
        ]}
      />
    </CRDGuard>
  );
}
