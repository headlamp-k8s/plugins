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
import { formatHostSelector } from './hostSelector';
import { metal3MachineTemplateClass } from './List';

/**
 * Detail view for a single Metal3MachineTemplate.
 *
 * A Metal3MachineTemplate is a blueprint that Cluster API stamps Metal3Machines
 * from; its `spec.template.spec` is the embedded machine spec. `DetailsGrid`
 * renders the standard metadata and Events section; the `extraInfo` callback
 * surfaces the blueprint's key fields.
 *
 * @param props.name - Template name; falls back to the `:name` route param.
 * @param props.namespace - Template namespace; falls back to the `:namespace` route param.
 */
export function Metal3MachineTemplateDetail(props: { name?: string; namespace?: string }) {
  const params = useParams<{ name: string; namespace: string }>();
  const { name = params.name, namespace = params.namespace } = props;

  return (
    <CRDGuard
      crdName="metal3machinetemplates.infrastructure.cluster.x-k8s.io"
      resourceLabel="Metal3 Machine Template"
    >
      <DetailsGrid
        resourceType={metal3MachineTemplateClass()}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={(item: any) =>
          item && [
            {
              name: 'Host Selector',
              value: formatHostSelector(item.jsonData.spec?.template?.spec?.hostSelector),
            },
            {
              name: 'Node Reuse',
              value: item.jsonData.spec?.nodeReuse ? 'Yes' : 'No',
            },
            {
              name: 'Image',
              value: item.jsonData.spec?.template?.spec?.image?.url || '-',
            },
            {
              name: 'Automated Cleaning Mode',
              value: item.jsonData.spec?.template?.spec?.automatedCleaningMode || '-',
            },
            {
              name: 'Data Template',
              value: item.jsonData.spec?.template?.spec?.dataTemplate?.name || '-',
            },
          ]
        }
      />
    </CRDGuard>
  );
}
