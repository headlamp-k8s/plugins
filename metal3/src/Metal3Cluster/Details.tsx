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
import { metal3ClusterClass } from './List';

/** Label Cluster API stamps on a resource to record its owning cluster. */
const CLUSTER_NAME_LABEL = 'cluster.x-k8s.io/cluster-name';

/**
 * Detail view for a single Metal3Cluster.
 *
 * A Metal3Cluster is the Metal3 (infrastructure) side of a Cluster API Cluster;
 * it carries the control plane endpoint and reports whether the cluster
 * infrastructure is provisioned. `DetailsGrid` renders the standard metadata and
 * Events; the `extraInfo` callback surfaces the cluster-level fields.
 *
 * @param props.name - Cluster name; falls back to the `:name` route param.
 * @param props.namespace - Cluster namespace; falls back to the `:namespace` route param.
 */
export function Metal3ClusterDetail(props: { name?: string; namespace?: string }) {
  const params = useParams<{ name: string; namespace: string }>();
  const { name = params.name, namespace = params.namespace } = props;

  return (
    <CRDGuard
      crdName="metal3clusters.infrastructure.cluster.x-k8s.io"
      resourceLabel="Metal3 Cluster"
    >
      <DetailsGrid
        resourceType={metal3ClusterClass()}
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
              name: 'Control Plane Endpoint',
              value: (() => {
                const ep = item.jsonData.spec?.controlPlaneEndpoint;
                return ep?.host
                  ? typeof ep.port === 'number'
                    ? `${ep.host}:${ep.port}`
                    : ep.host
                  : '-';
              })(),
            },
            {
              name: 'Cluster',
              value: item.jsonData.metadata?.labels?.[CLUSTER_NAME_LABEL] || '-',
            },
            {
              name: 'Cloud Provider Enabled',
              value: (() => {
                const enabled = item.jsonData.spec?.cloudProviderEnabled;
                return enabled === undefined ? '-' : enabled ? 'Yes' : 'No';
              })(),
            },
          ]
        }
      />
    </CRDGuard>
  );
}
