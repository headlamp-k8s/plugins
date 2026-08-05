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
import { metal3RemediationClass } from './List';

/**
 * Detail view for a single Metal3Remediation.
 *
 * A Metal3Remediation drives the repair of an unhealthy machine, usually by
 * rebooting or reprovisioning the host, according to its strategy. `DetailsGrid`
 * renders the standard metadata and Events; the `extraInfo` callback surfaces the
 * strategy and retry state.
 *
 * @param props.name - Remediation name; falls back to the `:name` route param.
 * @param props.namespace - Remediation namespace; falls back to the `:namespace` route param.
 */
export function Metal3RemediationDetail(props: { name?: string; namespace?: string }) {
  const params = useParams<{ name: string; namespace: string }>();
  const { name = params.name, namespace = params.namespace } = props;

  return (
    <CRDGuard
      crdName="metal3remediations.infrastructure.cluster.x-k8s.io"
      resourceLabel="Metal3 Remediation"
    >
      <DetailsGrid
        resourceType={metal3RemediationClass()}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={(item: any) =>
          item && [
            {
              name: 'Phase',
              value: item.jsonData.status?.phase || '-',
            },
            {
              name: 'Strategy',
              value: item.jsonData.spec?.strategy?.type || '-',
            },
            {
              name: 'Retry Limit',
              value:
                item.jsonData.spec?.strategy?.retryLimit === undefined
                  ? '-'
                  : String(item.jsonData.spec.strategy.retryLimit),
            },
            {
              name: 'Retry Count',
              value: String(item.jsonData.status?.retryCount ?? 0),
            },
            {
              name: 'Last Remediated',
              value: item.jsonData.status?.lastRemediated || '-',
            },
          ]
        }
      />
    </CRDGuard>
  );
}
