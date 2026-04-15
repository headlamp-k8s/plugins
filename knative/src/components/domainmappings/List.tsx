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
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Chip, Typography } from '@mui/material';
import React, { useMemo } from 'react';
import { useClusters } from '../../hooks/useClusters';
import { ClusterDomainClaim, KnativeDomainMapping } from '../../resources/knative';
import { createClusterDomainClaim, getClusterDomainClaim } from '../../utils/domain';
import { useNotify } from '../common/notifications/useNotify';
import { ReadyStatusLabel } from '../common/ReadyStatusLabel';
import { DomainMappingRowAction } from './list/header/DomainMappingRowAction';

function getReadyCondition(dm: KnativeDomainMapping): {
  status: 'True' | 'False' | 'Unknown';
  reason?: string;
  message?: string;
} {
  const readyCondition = dm.status?.conditions?.find(c => c.type === 'Ready');
  let status: 'True' | 'False' | 'Unknown' = 'Unknown';
  if (readyCondition?.status === 'True') status = 'True';
  else if (readyCondition?.status === 'False') status = 'False';
  return {
    status,
    reason: readyCondition?.reason,
    message: readyCondition?.message,
  };
}

export function useDomainMappingColumns(
  clusters: string[],
  clusterDomainClaims: ClusterDomainClaim[] | null
) {
  const showClusterColumn = clusters.length > 1;

  return useMemo<
    (ResourceTableColumn<KubeObject> | 'namespace' | 'cluster' | 'age' | 'name')[]
  >(() => {
    const cols: (ResourceTableColumn<KubeObject> | 'namespace' | 'cluster' | 'age' | 'name')[] = [
      'name',
      'namespace',
      ...(showClusterColumn ? (['cluster'] as const) : []),
      {
        id: 'ready',
        label: 'Ready',
        gridTemplate: 'auto',
        disableFiltering: true,
        getValue: item => {
          const dm = item as KnativeDomainMapping;
          return getReadyCondition(dm).status === 'True' ? 1 : 0;
        },
        render: item => {
          const dm = item as KnativeDomainMapping;
          const ready = getReadyCondition(dm);
          return (
            <ReadyStatusLabel status={ready.status} reason={ready.reason} message={ready.message} />
          );
        },
        sort: (a, b) => {
          const statusA = getReadyCondition(a as KnativeDomainMapping).status === 'True' ? 1 : 0;
          const statusB = getReadyCondition(b as KnativeDomainMapping).status === 'True' ? 1 : 0;
          return statusA - statusB;
        },
      },
      {
        id: 'clusterdomainclaim',
        label: 'ClusterDomainClaim',
        gridTemplate: 'auto',
        disableFiltering: true,
        getValue: item => {
          const dm = item as KnativeDomainMapping;
          const cluster = dm.cluster || clusters[0] || '';
          const ns = dm.metadata.namespace || '';
          return getClusterDomainClaim(dm, clusterDomainClaims, cluster, ns).state;
        },
        render: item => {
          const dm = item as KnativeDomainMapping;
          const cluster = dm.cluster || clusters[0] || '';
          const ns = dm.metadata.namespace || '';
          const { state, claim } = getClusterDomainClaim(dm, clusterDomainClaims, cluster, ns);

          if (state === 'unknown') {
            return (
              <Typography variant="body2" color="text.secondary">
                -
              </Typography>
            );
          }

          if (state === 'present') {
            const group = ClusterDomainClaim.apiVersion.split('/')[0];
            const crd = `${ClusterDomainClaim.apiName}.${group}`;
            return (
              <Link
                routeName="customresource"
                params={{
                  cluster: cluster,
                  crd: crd,
                  namespace: '-',
                  crName: claim?.metadata.name,
                }}
              >
                <Chip label="Present" color="success" size="small" clickable />
              </Link>
            );
          }
        },
      },
      {
        id: 'url',
        label: 'URL',
        gridTemplate: 'auto',
        getValue: item => (item as KnativeDomainMapping).readyUrl ?? '',
        render: item => {
          const dm = item as KnativeDomainMapping;
          return dm.readyUrl ? (
            <Typography variant="caption" color="text.secondary">
              <a href={dm.readyUrl} target="_blank" rel="noreferrer">
                {dm.readyUrl}
              </a>
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          );
        },
      },
      'age',
    ];

    return cols;
  }, [showClusterColumn, clusterDomainClaims, clusters]);
}

function DomainMappingsListContents({ clusters }: { clusters: string[] }) {
  const { notifyError, notifyInfo } = useNotify();

  // We need to fetch ClusterDomainClaims to cross-reference their status
  const clusterDomainClaimsResult = ClusterDomainClaim.useList({ clusters });
  const clusterDomainClaims = clusterDomainClaimsResult.items;

  const columns = useDomainMappingColumns(clusters, clusterDomainClaims);

  const headerProps = useMemo(
    () => ({
      noNamespaceFilter: false,
      titleSideActions:
        clusters.length === 0
          ? undefined
          : [
              <CreateResourceButton
                key="domainmapping-create-button"
                resourceClass={KnativeDomainMapping}
                resourceName="DomainMapping"
              />,
            ],
    }),
    [clusters.length]
  );

  const actions: React.ComponentProps<typeof ResourceListView>['actions'] = useMemo(
    () => [
      {
        id: 'knative.domainmapping-actions',
        action: context => {
          const dm: KnativeDomainMapping = context.item;
          const namespace = dm.metadata.namespace || '';
          const cluster = dm.cluster || clusters[0] || '';
          const { state } = getClusterDomainClaim(dm, clusterDomainClaims, cluster, namespace);

          if (state === 'missing') {
            return (
              <DomainMappingRowAction
                dm={dm}
                onAction={async () => {
                  try {
                    await createClusterDomainClaim(dm, namespace);
                    notifyInfo('ClusterDomainClaim created');
                  } catch (err: unknown) {
                    const error = err as { message?: string } | undefined;
                    notifyError(error?.message || 'Failed to create ClusterDomainClaim');
                  }
                  context.closeMenu?.();
                }}
              />
            );
          }

          return null;
        },
      },
    ],
    [clusterDomainClaims, clusters]
  );

  return (
    <ResourceListView
      title="Domain Mappings"
      headerProps={headerProps}
      resourceClass={KnativeDomainMapping}
      columns={columns}
      reflectInURL="knative-domainmappings"
      id="knative-domainmappings"
      actions={actions}
    />
  );
}

export function DomainMappingsList() {
  const clusters = useClusters();

  return <DomainMappingsListContents clusters={clusters} />;
}
