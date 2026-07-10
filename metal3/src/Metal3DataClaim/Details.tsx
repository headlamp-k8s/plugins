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
import { metal3DataClaimClass } from './List';

/**
 * Detail view for a single Metal3DataClaim.
 *
 * A Metal3DataClaim requests rendered data from a Metal3DataTemplate, the same
 * way a storage claim asks for a volume; its status carries the resulting
 * Metal3Data. `DetailsGrid` renders the standard metadata and Events; the
 * `extraInfo` callback surfaces the claim fields.
 *
 * @param props.name - Claim name; falls back to the `:name` route param.
 * @param props.namespace - Claim namespace; falls back to the `:namespace` route param.
 */
export function Metal3DataClaimDetail(props: { name?: string; namespace?: string }) {
  const params = useParams<{ name: string; namespace: string }>();
  const { name = params.name, namespace = params.namespace } = props;

  return (
    <CRDGuard
      crdName="metal3dataclaims.infrastructure.cluster.x-k8s.io"
      resourceLabel="Metal3 Data Claim"
    >
      <DetailsGrid
        resourceType={metal3DataClaimClass()}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={(item: any) =>
          item && [
            {
              name: 'Template',
              value: item.jsonData.spec?.template?.name || '-',
            },
            {
              name: 'Rendered Data',
              value: item.jsonData.status?.renderedData?.name || '-',
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
