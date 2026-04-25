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
  ResourceTable,
  type ResourceTableColumn,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { ReadyStatusLabel } from '../../../../../components/common/ReadyStatusLabel';
import { KnativeDomainMapping, KService } from '../../../../../resources/knative';
import { ClusterDomainClaim } from '../../../../../resources/knative/clusterDomainClaim';
import {
  createClusterDomainClaim,
  createDomainMapping,
  getClusterDomainClaim,
} from '../../../../../utils/domain';
import { useNotify } from '../../../../common/notifications/useNotify';
import { DomainMappingRowAction } from '../../../../domainmappings/list/header/DomainMappingRowAction';
import { useKServicePermissions } from '../../permissions/KServicePermissionsProvider';

type Props = {
  namespace: string;
  serviceName: string;
  cluster: string;
  kservice: KService;
};

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

export default function DomainMappingSection({ namespace, serviceName, cluster }: Props) {
  const clusters = [cluster];
  const { notifyError, notifyInfo } = useNotify();
  const [creating, setCreating] = React.useState<boolean>(false);
  const [domainInput, setDomainInput] = React.useState<string>('');
  const { pathname } = useLocation();
  const { canCreateDomainMapping, canCreateClusterDomainClaim } = useKServicePermissions();

  const domainMappingListResult = KnativeDomainMapping.useList({ clusters, namespace });
  const domainMappingsData = domainMappingListResult.items;

  const clusterDomainClaimsResult = ClusterDomainClaim.useList({ clusters });
  const clusterDomainClaims = clusterDomainClaimsResult.items;

  const mappings = domainMappingsData
    ? domainMappingsData.filter(dm => {
        const ref = dm.spec?.ref;
        const refNs = ref?.namespace || dm.metadata?.namespace;
        return ref?.name === serviceName && refNs === namespace;
      })
    : null;

  async function handleCreate() {
    setCreating(true);
    try {
      await createDomainMapping(domainInput, cluster, namespace, serviceName);
      notifyInfo('DomainMapping Created');
      setDomainInput('');
    } catch (err: unknown) {
      const error = err as { message?: string } | undefined;
      const detail = error?.message?.trim();
      notifyError(detail ? `Failed to create: ${detail}` : 'Failed to create Domain Mapping');
    } finally {
      setCreating(false);
    }
  }

  // NOTE:
  // - ResourceTable always includes its default DeleteButton, which dispatches a clusterAction and
  //   navigates to item.getListLink(). We override getListLink per item to keep users on this page.
  async function handleCreateClusterDomainClaim(dm: KnativeDomainMapping) {
    try {
      await createClusterDomainClaim(dm, namespace);
      notifyInfo('ClusterDomainClaim created');
    } catch (err: unknown) {
      const error = err as { message?: string } | undefined;
      notifyError(error?.message || 'Failed to create ClusterDomainClaim');
    }
  }

  const showClusterColumn = clusters.length > 1;

  const columns: (ResourceTableColumn<KubeObject> | 'cluster' | 'age' | 'name')[] = [
    ...(showClusterColumn ? (['cluster'] as const) : []),
    'name',
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
        return getClusterDomainClaim(dm, clusterDomainClaims, cluster, namespace).state;
      },
      render: item => {
        const dm = item as KnativeDomainMapping;
        const { state } = getClusterDomainClaim(dm, clusterDomainClaims, cluster, namespace);
        if (state === 'unknown') {
          return (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          );
        }

        return state === 'present' ? (
          <Chip label="Present" color="success" size="small" />
        ) : (
          <Chip label="Missing" color="warning" size="small" />
        );
      },
    },
    {
      id: 'url',
      label: 'URL',
      getValue: item => (item as KnativeDomainMapping).readyUrl ?? '',
      gridTemplate: 'auto',
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

  const errorMessage = domainMappingListResult.errors?.[0]?.message ?? null;

  // Prevent the default DeleteButton from navigating away.
  const mappingsForTable = mappings?.map(dm => {
    const effectiveCluster = dm.cluster || cluster;
    if (!dm.cluster && effectiveCluster) {
      dm.cluster = effectiveCluster;
    }

    dm.getListLink = () => pathname;

    return dm;
  });

  return (
    <SectionBox title="Custom Domains (DomainMapping)">
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <TextField
            label="Domain name (e.g. app.example.com)"
            size="small"
            value={domainInput}
            onChange={e => setDomainInput(e.target.value)}
            disabled={creating}
            fullWidth
          />
          {canCreateClusterDomainClaim === true && canCreateDomainMapping === true && (
            <Button variant="contained" onClick={handleCreate} disabled={creating}>
              Create
            </Button>
          )}
        </Stack>

        <Box>
          <ResourceTable.default<typeof KnativeDomainMapping>
            id="knative-kservice-domainmappings"
            columns={columns}
            data={mappingsForTable ?? null}
            errors={domainMappingListResult.errors ?? null}
            errorMessage={errorMessage}
            enableRowActions
            enableRowSelection
            reflectInURL={false}
            actions={[
              {
                id: 'knative.domainmapping-actions',
                action: context => {
                  const dm: KnativeDomainMapping = context.item;
                  const { state } = getClusterDomainClaim(
                    dm,
                    clusterDomainClaims,
                    cluster,
                    namespace
                  );
                  if (state === 'missing') {
                    return (
                      <DomainMappingRowAction
                        dm={dm}
                        onAction={async () => {
                          await handleCreateClusterDomainClaim(dm);
                          context.closeMenu?.();
                        }}
                      />
                    );
                  }

                  return null;
                },
              },
            ]}
          />
        </Box>
      </Stack>
    </SectionBox>
  );
}
