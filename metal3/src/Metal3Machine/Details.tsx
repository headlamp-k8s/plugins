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
import { Link } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { CRDGuard } from '../common/CRDGuard';
import { HOST_ANNOTATION, parseHostAnnotation } from './hostAnnotation';
import { metal3MachineClass } from './List';

/** Label Cluster API stamps on a Metal3Machine to record its owning cluster. */
const CLUSTER_NAME_LABEL = 'cluster.x-k8s.io/cluster-name';

/**
 * Detail view for a single Metal3Machine.
 *
 * `DetailsGrid` renders the standard metadata and the Events section; the
 * `extraInfo` callback supplies the Metal3Machine-specific fields, including the
 * BareMetalHost it is bound to, which the provider records on the
 * `metal3.io/BareMetalHost` annotation rather than as a typed spec field.
 *
 * @param props.name - Machine name; falls back to the `:name` route param.
 * @param props.namespace - Machine namespace; falls back to the `:namespace` route param.
 */
export function Metal3MachineDetail(props: { name?: string; namespace?: string }) {
  const params = useParams<{ name: string; namespace: string }>();
  const { name = params.name, namespace = params.namespace } = props;

  return (
    <CRDGuard
      crdName="metal3machines.infrastructure.cluster.x-k8s.io"
      resourceLabel="Metal3 Machine"
    >
      <DetailsGrid
        resourceType={metal3MachineClass()}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={(item: any) =>
          item && [
            {
              name: 'Provisioned',
              value:
                item.jsonData.status?.initialization?.provisioned === undefined
                  ? 'Unknown'
                  : item.jsonData.status.initialization.provisioned
                  ? 'Yes'
                  : 'No',
            },
            {
              name: 'Provider ID',
              value: item.jsonData.spec?.providerID || '-',
            },
            {
              name: 'Cluster',
              value: item.jsonData.metadata?.labels?.[CLUSTER_NAME_LABEL] || '-',
            },
            {
              name: 'Image',
              value: item.jsonData.spec?.image?.url || '-',
            },
            {
              name: 'BareMetalHost',
              value: (() => {
                const raw = item.jsonData.metadata?.annotations?.[HOST_ANNOTATION];
                const host = parseHostAnnotation(raw);
                // Link to the host's detail when the annotation is a well-formed
                // namespace/name; otherwise fall back to the raw value or "-".
                return host ? (
                  <Link
                    routeName="baremetalhost-detail"
                    params={{ namespace: host.namespace, name: host.name }}
                  >
                    {host.name}
                  </Link>
                ) : (
                  raw || '-'
                );
              })(),
            },
          ]
        }
      />
    </CRDGuard>
  );
}
