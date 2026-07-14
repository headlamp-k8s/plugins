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
import { metal3RemediationTemplateClass } from './List';

/**
 * Detail view for a single Metal3RemediationTemplate.
 *
 * A Metal3RemediationTemplate is a blueprint that defines the remediation
 * strategy Metal3Remediations are stamped from; its `spec.template.spec` is the
 * embedded remediation spec. `DetailsGrid` renders the standard metadata and
 * Events; the `extraInfo` callback surfaces the strategy.
 *
 * @param props.name - Template name; falls back to the `:name` route param.
 * @param props.namespace - Template namespace; falls back to the `:namespace` route param.
 */
export function Metal3RemediationTemplateDetail(props: { name?: string; namespace?: string }) {
  const params = useParams<{ name: string; namespace: string }>();
  const { name = params.name, namespace = params.namespace } = props;

  return (
    <CRDGuard
      crdName="metal3remediationtemplates.infrastructure.cluster.x-k8s.io"
      resourceLabel="Metal3 Remediation Template"
    >
      <DetailsGrid
        resourceType={metal3RemediationTemplateClass()}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={(item: any) => {
          const strategy = item?.jsonData.spec?.template?.spec?.strategy;
          return (
            item && [
              {
                name: 'Strategy',
                value: strategy?.type || '-',
              },
              {
                name: 'Retry Limit',
                value: strategy?.retryLimit === undefined ? '-' : String(strategy.retryLimit),
              },
            ]
          );
        }}
      />
    </CRDGuard>
  );
}
