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

/** Defines the Metal3Remediation custom resource (group/version/kind) for the plugin. */
export function metal3RemediationClass() {
  const group = 'infrastructure.cluster.x-k8s.io';
  const version = 'v1beta2';
  const Metal3Remediation = makeCustomResourceClass({
    apiInfo: [{ group, version }],
    kind: 'Metal3Remediation',
    pluralName: 'metal3remediations',
    singularName: 'Metal3Remediation',
    isNamespaced: true,
  });

  return class extendedMetal3RemediationClass extends Metal3Remediation {
    static get detailsRoute() {
      return 'metal3remediation-detail';
    }
  };
}

/** List view for Metal3Remediation resources, guarded by CRD presence. */
export function Metal3Remediations() {
  return (
    <CRDGuard
      crdName="metal3remediations.infrastructure.cluster.x-k8s.io"
      resourceLabel="Metal3 Remediation"
    >
      <ResourceListView
        title="Metal3 Remediations"
        resourceClass={metal3RemediationClass()}
        columns={[
          'name',
          'namespace',
          {
            id: 'phase',
            label: 'Phase',
            getValue: (r: KubeObject) => r.jsonData.status?.phase || '-',
          },
          {
            id: 'strategy',
            label: 'Strategy',
            getValue: (r: KubeObject) => r.jsonData.spec?.strategy?.type || '-',
          },
          {
            // Retry progress as count / limit.
            id: 'retry',
            label: 'Retries',
            getValue: (r: KubeObject) => {
              const count = r.jsonData.status?.retryCount ?? 0;
              const limit = r.jsonData.spec?.strategy?.retryLimit;
              return limit === undefined ? String(count) : `${count} / ${limit}`;
            },
          },
          'age',
        ]}
      />
    </CRDGuard>
  );
}
