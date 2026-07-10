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
import { metal3DataClass } from './List';

/**
 * Detail view for a single Metal3Data.
 *
 * A Metal3Data is the rendered per-node metadata and network data produced for a
 * machine from a Metal3DataTemplate. `DetailsGrid` renders the standard metadata
 * and Events; the `extraInfo` callback surfaces the rendered-data fields.
 *
 * @param props.name - Data name; falls back to the `:name` route param.
 * @param props.namespace - Data namespace; falls back to the `:namespace` route param.
 */
export function Metal3DataDetail(props: { name?: string; namespace?: string }) {
  const params = useParams<{ name: string; namespace: string }>();
  const { name = params.name, namespace = params.namespace } = props;

  return (
    <CRDGuard crdName="metal3datas.infrastructure.cluster.x-k8s.io" resourceLabel="Metal3 Data">
      <DetailsGrid
        resourceType={metal3DataClass()}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={(item: any) =>
          item && [
            {
              name: 'Ready',
              value:
                item.jsonData.status?.ready === undefined
                  ? 'Unknown'
                  : item.jsonData.status.ready
                  ? 'Yes'
                  : 'No',
            },
            {
              name: 'Index',
              value:
                item.jsonData.spec?.index === undefined ? '-' : String(item.jsonData.spec.index),
            },
            {
              name: 'Template',
              value: item.jsonData.spec?.template?.name || '-',
            },
            {
              name: 'Claim',
              value: item.jsonData.spec?.claim?.name || '-',
            },
            {
              name: 'Error',
              value: item.jsonData.status?.errorMessage || '-',
            },
          ]
        }
      />
    </CRDGuard>
  );
}
