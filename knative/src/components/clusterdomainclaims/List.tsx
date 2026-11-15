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

import {
  CreateResourceButton,
  Link,
  ResourceListView,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Chip, Typography } from '@mui/material';
import React, { useMemo } from 'react';
import { useClusters } from '../../hooks/useClusters';
import { ClusterDomainClaim, KnativeDomainMapping } from '../../resources/knative';

/**
 * Builds the columns of a ClusterDomainClaims table.
 *
 * @param clusters - The selected clusters; with more than one, a cluster column is added.
 * @param domainMappings - The Domain Mappings, to find the one each claim is for; null while they
 * load.
 * @returns The columns.
 */
export function useClusterDomainClaimColumns(
  clusters: string[],
  domainMappings: KnativeDomainMapping[] | null
) {
  const showClusterColumn = clusters.length > 1;

  return useMemo<(ResourceTableColumn<ClusterDomainClaim> | 'age' | 'name')[]>(() => {
    const clusterColumn: ResourceTableColumn<ClusterDomainClaim> = {
      id: 'cluster',
      label: 'Cluster',
      gridTemplate: 'auto',
      getValue: item => item.cluster ?? '',
    };
    const cols: (ResourceTableColumn<ClusterDomainClaim> | 'age' | 'name')[] = [
      'name',
      {
        id: 'namespace',
        label: 'Namespace',
        gridTemplate: 'auto',
        getValue: cdc => {
          return cdc.spec?.namespace || '';
        },
        render: cdc => {
          const ns = cdc.spec?.namespace;
          const cluster = cdc.cluster || clusters[0] || '';

          if (!ns) {
            return (
              <Typography variant="body2" color="text.secondary">
                -
              </Typography>
            );
          }

          return (
            <Link routeName="namespace" params={{ name: ns, cluster: cluster }}>
              {ns}
            </Link>
          );
        },
      },
      ...(showClusterColumn ? [clusterColumn] : []),
      {
        id: 'domainmapping',
        label: 'Domain Mapping',
        gridTemplate: 'auto',
        disableFiltering: true,
        getValue: cdc => {
          const cluster = cdc.cluster || clusters[0] || '';
          const expectedNamespace = cdc.spec?.namespace || '';
          if (!expectedNamespace || !domainMappings) return 'unknown';

          const found = domainMappings.some(
            dm =>
              dm.metadata.name === cdc.metadata.name &&
              dm.metadata.namespace === expectedNamespace &&
              (dm.cluster || clusters[0] || '') === cluster
          );

          return found ? 'present' : 'missing';
        },
        render: cdc => {
          const cluster = cdc.cluster || clusters[0] || '';
          const expectedNamespace = cdc.spec?.namespace || '';

          if (!domainMappings) {
            return (
              <Typography variant="body2" color="text.secondary">
                -
              </Typography>
            );
          }

          if (!expectedNamespace) {
            return (
              <Typography
                variant="body2"
                color="text.secondary"
                title="No namespace specified in spec"
              >
                -
              </Typography>
            );
          }

          const found = domainMappings.find(
            dm =>
              dm.metadata.name === cdc.metadata.name &&
              dm.metadata.namespace === expectedNamespace &&
              (dm.cluster || clusters[0] || '') === cluster
          );

          if (found) {
            const group = KnativeDomainMapping.apiVersion.split('/')[0];
            const crd = `${KnativeDomainMapping.apiName}.${group}`;
            return (
              <Link
                routeName="customresource"
                params={{
                  cluster: found.cluster || clusters[0],
                  crd: crd,
                  namespace: found.metadata.namespace,
                  crName: found.metadata.name,
                }}
              >
                <Chip label="Present" color="success" size="small" clickable />
              </Link>
            );
          } else {
            return <Chip label="Missing" color="warning" size="small" />;
          }
        },
      },
      'age',
    ];

    return cols;
  }, [showClusterColumn, domainMappings, clusters]);
}

function ClusterDomainClaimsListContent({ clusters }: { clusters: string[] }) {
  const domainMappingsResult = KnativeDomainMapping.useList({ clusters });
  const domainMappings = domainMappingsResult.items;

  const columns = useClusterDomainClaimColumns(clusters, domainMappings);

  const headerProps = useMemo(
    () => ({
      noNamespaceFilter: true,
      titleSideActions:
        clusters.length === 0
          ? undefined
          : [
              <CreateResourceButton
                key="clusterdomainclaim-create-button"
                resourceClass={ClusterDomainClaim}
                resourceName="ClusterDomainClaim"
              />,
            ],
    }),
    [clusters.length]
  );

  return (
    <ResourceListView
      title="Cluster Domain Claims"
      headerProps={headerProps}
      resourceClass={ClusterDomainClaim}
      columns={columns}
      reflectInURL="knative-clusterdomainclaims"
      id="knative-clusterdomainclaims"
    />
  );
}

export function ClusterDomainClaimsList() {
  const clusters = useClusters();

  return <ClusterDomainClaimsListContent clusters={clusters} />;
}
