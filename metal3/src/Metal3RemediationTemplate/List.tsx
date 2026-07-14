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

/** Defines the Metal3RemediationTemplate custom resource (group/version/kind) for the plugin. */
export function metal3RemediationTemplateClass() {
  const group = 'infrastructure.cluster.x-k8s.io';
  const version = 'v1beta2';
  const Metal3RemediationTemplate = makeCustomResourceClass({
    apiInfo: [{ group, version }],
    kind: 'Metal3RemediationTemplate',
    pluralName: 'metal3remediationtemplates',
    singularName: 'Metal3RemediationTemplate',
    isNamespaced: true,
  });

  return class extendedMetal3RemediationTemplateClass extends Metal3RemediationTemplate {
    static get detailsRoute() {
      return 'metal3remediationtemplate-detail';
    }
  };
}

/** List view for Metal3RemediationTemplate resources, guarded by CRD presence. */
export function Metal3RemediationTemplates() {
  return (
    <CRDGuard
      crdName="metal3remediationtemplates.infrastructure.cluster.x-k8s.io"
      resourceLabel="Metal3 Remediation Template"
    >
      <ResourceListView
        title="Metal3 Remediation Templates"
        resourceClass={metal3RemediationTemplateClass()}
        columns={[
          'name',
          'namespace',
          {
            // Remediation strategy from the embedded remediation spec.
            id: 'strategy',
            label: 'Strategy',
            getValue: (t: KubeObject) => t.jsonData.spec?.template?.spec?.strategy?.type || '-',
          },
          'age',
        ]}
      />
    </CRDGuard>
  );
}
