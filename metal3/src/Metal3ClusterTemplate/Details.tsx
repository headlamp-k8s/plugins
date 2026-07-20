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

import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { CRDGuard } from '../common/CRDGuard';
import { metal3ClusterTemplateClass } from './List';

/**
 * Detail view for a single Metal3ClusterTemplate.
 *
 * A Metal3ClusterTemplate is a blueprint that Cluster API stamps Metal3Clusters
 * from; its `spec.template.spec` is the embedded cluster spec. `DetailsGrid`
 * renders the standard metadata and Events; the `extraInfo` callback surfaces the
 * blueprint's key fields.
 *
 * @param props.name - Template name; falls back to the `:name` route param.
 * @param props.namespace - Template namespace; falls back to the `:namespace` route param.
 */
export function Metal3ClusterTemplateDetail(props: { name?: string; namespace?: string }) {
  const params = useParams<{ name: string; namespace: string }>();
  const { name = params.name, namespace = params.namespace } = props;

  return (
    <CRDGuard
      crdName="metal3clustertemplates.infrastructure.cluster.x-k8s.io"
      resourceLabel="Metal3 Cluster Template"
    >
      <DetailsGrid
        resourceType={metal3ClusterTemplateClass()}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={(item: any) =>
          item && [
            {
              name: 'Cloud Provider Enabled',
              value: (() => {
                const enabled = item.jsonData.spec?.template?.spec?.cloudProviderEnabled;
                return enabled === undefined ? '-' : enabled ? 'Yes' : 'No';
              })(),
            },
          ]
        }
      />
    </CRDGuard>
  );
}
