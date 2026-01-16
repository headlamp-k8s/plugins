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
import { KnativeDomainMapping, KService } from '../../../../../resources/knative';
import { ClusterDomainClaim } from '../../../../../resources/knative/clusterDomainClaim';
import { useNotify } from '../../../../common/notifications/useNotify';
import { useKServicePermissions } from '../../permissions/KServicePermissionsProvider';
import { DomainMappingRowAction } from './DomainMappingRowAction';

type Props = {
  namespace: string;
  serviceName: string;
  cluster: string;
  kservice: KService;
};

function isReady(dm: KnativeDomainMapping): boolean {
  return dm.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True';
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

  function getClusterDomainClaim(dm: KnativeDomainMapping): {
    state: 'unknown' | 'missing' | 'present';
    claim: ClusterDomainClaim | null;
  } {
    if (!clusterDomainClaims) {
      return { state: 'unknown', claim: null };
    }
    const host = dm.host?.trim();
    if (!host) {
      return { state: 'unknown', claim: null };
    }

    // DomainMappingSection is single-cluster today, but keep this safe if it ever becomes multi-cluster.
    const effectiveCluster = dm.cluster || cluster;
    const requireClusterMatch = clusters.length > 1;

    const claim =
      clusterDomainClaims.find(
        cdc =>
          (!requireClusterMatch || cdc.cluster === effectiveCluster) &&
          cdc.metadata?.name === host &&
          cdc.targetNamespace === namespace
      ) ?? null;

    if (claim && !claim.cluster && effectiveCluster) {
      claim.cluster = effectiveCluster;
    }

    return claim ? { state: 'present', claim } : { state: 'missing', claim: null };
  }

  function isValidDomain(host: string): boolean {
    // very permissive host validation; rely on API for authoritative validation
    const h = host.trim();
    if (h.length < 1 || h.length > 253) return false;
    // simple label check (letters, digits, hyphen; labels do not start/end with hyphen)
    return h.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
  }

  async function ensureClusterDomainClaim(opts: {
    host: string;
    cluster: string;
    namespace: string;
  }) {
    try {
      await ClusterDomainClaim.apiEndpoint.post(
        {
          apiVersion: ClusterDomainClaim.apiVersion,
          kind: ClusterDomainClaim.kind,
          metadata: { name: opts.host },
          spec: { namespace: opts.namespace },
        },
        {},
        opts.cluster
      );
    } catch (e: unknown) {
      const error = e as { message?: string } | undefined;
      const msg = String(error?.message || '');
      // Ignore if already exists or conflicts (loosely check for 409/AlreadyExists messages)
      if (!/AlreadyExists|409|exists/i.test(msg)) {
        throw e;
      }
    }
  }

  async function handleCreate() {
    const host = domainInput.trim();
    if (!host) {
      notifyError('Please enter a domain name');
      return;
    }
    if (!isValidDomain(host)) {
      notifyError('Invalid domain name format');
      return;
    }
    if (!cluster) {
      notifyError('No cluster available');
      return;
    }
    setCreating(true);
    try {
      // 1) Create ClusterDomainClaim first (ignore if already exists)
      await ensureClusterDomainClaim({ host, cluster, namespace });
      // 2) Create DomainMapping
      await KnativeDomainMapping.apiEndpoint.post(
        {
          apiVersion: KnativeDomainMapping.apiVersion,
          kind: KnativeDomainMapping.kind,
          metadata: {
            name: host,
            namespace,
          },
          spec: {
            ref: {
              apiVersion: 'serving.knative.dev/v1',
              kind: 'Service',
              name: serviceName,
              namespace,
            },
          },
        },
        {},
        cluster
      );
      notifyInfo('DomainMapping created');
      setDomainInput('');
    } catch (err: unknown) {
      const error = err as { message?: string } | undefined;
      const detail = error?.message?.trim();
      notifyError(detail ? `Failed to create: ${detail}` : 'Failed to create DomainMapping');
    } finally {
      setCreating(false);
    }
  }

  // NOTE:
  // - ResourceTable always includes its default DeleteButton, which dispatches a clusterAction and
  //   navigates to item.getListLink(). We override getListLink per item to keep users on this page.
  async function handleCreateClusterDomainClaim(dm: KnativeDomainMapping) {
    const host = dm.host?.trim();
    if (!host) {
      notifyError('Domain name is missing');
      return;
    }

    try {
      await ensureClusterDomainClaim({ host, cluster: dm.cluster, namespace });
      notifyInfo('ClusterDomainClaim created');

      // Add dummy annotation to trigger DomainMapping reconciliation
      try {
        await dm.patch({
          metadata: {
            annotations: {
              'knative.headlamp.dev/reconciledAt': new Date().toISOString(),
            },
          },
        });
      } catch (e2: unknown) {
        const error2 = e2 as { message?: string } | undefined;
        const detail2 = error2?.message?.trim();
        notifyError(
          detail2
            ? `Failed to annotate DomainMapping: ${detail2}`
            : 'Failed to annotate DomainMapping'
        );
      }
    } catch (e: unknown) {
      const error = e as { message?: string } | undefined;
      const detail = error?.message?.trim();
      notifyError(
        detail
          ? `Failed to create ClusterDomainClaim: ${detail}`
          : 'Failed to create ClusterDomainClaim'
      );
    }
  }

  const showClusterColumn = clusters.length > 1;

  const columns: (ResourceTableColumn<KubeObject> | 'cluster' | 'age' | 'name')[] = [
    ...(showClusterColumn ? (['cluster'] as const) : []),
    'name',
    {
      id: 'ready',
      label: 'Ready',
      gridTemplate: 'min-content',
      disableFiltering: true,
      getValue: item => (isReady(item as KnativeDomainMapping) ? 1 : 0),
      render: item =>
        isReady(item as KnativeDomainMapping) ? (
          <Chip label="Ready" color="success" size="small" />
        ) : (
          <Chip label="Not Ready" color="warning" size="small" />
        ),
      sort: (a, b) =>
        Number(isReady(a as KnativeDomainMapping)) - Number(isReady(b as KnativeDomainMapping)),
    },
    {
      id: 'clusterdomainclaim',
      label: 'ClusterDomainClaim',
      gridTemplate: 'min-content',
      disableFiltering: true,
      getValue: item => {
        const dm = item as KnativeDomainMapping;
        return getClusterDomainClaim(dm).state;
      },
      render: item => {
        const dm = item as KnativeDomainMapping;
        const { state } = getClusterDomainClaim(dm);
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
                  const { state } = getClusterDomainClaim(dm);
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
