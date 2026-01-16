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
  ActionButton,
  CreateResourceButton,
  ResourceListView,
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Link } from '@kinvolk/headlamp-plugin/lib/components/common';
import ConfigMap from '@kinvolk/headlamp-plugin/lib/k8s/configMap';
import Pod from '@kinvolk/headlamp-plugin/lib/k8s/pod';
import { Chip, Stack, Typography } from '@mui/material';
import React from 'react';
import { formatIngressClass, INGRESS_CLASS_GATEWAY_API } from '../../config/ingress';
import { useAuthorization } from '../../hooks/useAuthorization';
import { useClusters } from '../../hooks/useClusters';
import { useKnativeInstalled } from '../../hooks/useKnativeInstalled';
import { KnativeDomainMapping, KService } from '../../resources/knative';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import { useKServiceActions } from './detail/hooks/useKServiceActions';

type IngressClassWithCluster = {
  cluster: string;
  ingressClass: string | null;
};

function trafficSummary(svc: KService): string {
  const tr = svc.spec?.traffic || [];
  // Don't display 0% traffic
  const nonZero = tr.filter(t => (t.percent ?? 0) > 0);
  if (!nonZero.length) return '';
  return nonZero
    .map(t => {
      const target = t.latestRevision ? 'latest' : t.revisionName || 'rev';
      return `${t.percent ?? 0}% ${target}`;
    })
    .join(', ');
}

function getVisibilityLabel(svc: KService): 'Internal' | 'External' {
  return svc.metadata?.labels?.['networking.knative.dev/visibility'] === 'cluster-local'
    ? 'Internal'
    : 'External';
}

function getTags(svc: KService): string[] {
  const tags = Array.from(
    new Set((svc.spec?.traffic ?? []).map(t => t.tag).filter((v): v is string => Boolean(v)))
  );
  tags.sort();
  return tags;
}

function getRevisionShort(svc: KService, revisionName: string | undefined): string {
  if (!revisionName) {
    return '';
  }

  const name = svc.metadata.name;
  if (revisionName.startsWith(`${name}-`)) {
    return revisionName.slice(name.length + 1);
  }

  return revisionName;
}

function getReadyCondition(svc: KService): { status: string; reason?: string } | null {
  const conditions = svc.status?.conditions;
  if (!conditions) {
    return null;
  }

  const readyCondition = conditions.find(c => c.type === 'Ready');
  if (!readyCondition) {
    return null;
  }

  return {
    status: readyCondition.status || 'Unknown',
    reason: readyCondition.reason,
  };
}

function getServiceUrls(svc: KService, domainByServiceKey: Record<string, string[]>): string[] {
  const ns = svc.metadata.namespace || 'default';
  const name = svc.metadata.name;
  const key = `${svc.cluster}/${ns}/${name}`;
  const urls = domainByServiceKey[key];

  if (urls && urls.length > 0) {
    return urls;
  }

  if (svc.url) {
    return [svc.url];
  }

  return [];
}

type KServiceRowActionsProps = {
  kservice: KService;
  closeMenu?: () => void;
};

function KServiceRowActions({ kservice, closeMenu }: KServiceRowActionsProps) {
  const { acting, handleRedeploy, handleRestart } = useKServiceActions(kservice, {
    onDone: () => {
      if (closeMenu) {
        closeMenu();
      }
    },
  });
  const disabled = acting !== null;
  const namespace = kservice.metadata.namespace;
  const cluster = kservice.cluster;

  // Check permissions using hook
  const canPatchKService = useAuthorization({
    item: KService,
    authVerb: 'patch',
    namespace,
    cluster,
  });

  const canDeletePods = useAuthorization({
    item: Pod,
    authVerb: 'delete',
    namespace,
    cluster,
  });

  return (
    <>
      {canPatchKService.allowed === true && (
        <ActionButton
          description="Redeploy Latest Revision"
          buttonStyle="menu"
          onClick={handleRedeploy}
          icon="mdi:update"
          iconButtonProps={{ disabled }}
        />
      )}
      {canDeletePods.allowed === true && (
        <ActionButton
          description="Restart"
          buttonStyle="menu"
          onClick={handleRestart}
          icon="mdi:restart"
          iconButtonProps={{ disabled }}
        />
      )}
    </>
  );
}

type KServicesListContentsProps = {
  clusters: string[];
};

function KServicesListContents({ clusters }: KServicesListContentsProps) {
  const domainMappingsResult = KnativeDomainMapping.useList({ clusters });
  const domainMappingsData = domainMappingsResult.items;
  const domainMappingsError = domainMappingsResult.error;

  const configMapResult = ConfigMap.useList({
    clusters,
    namespace: 'knative-serving',
  });
  const configMaps = configMapResult.items;
  const ingressClassLoading = configMapResult.isLoading;

  const showClusterColumn = clusters.length > 1;

  const domainByServiceKey = React.useMemo(() => {
    const domainMap: Record<string, string[]> = {};
    if (!domainMappingsData) return domainMap;
    for (const dm of domainMappingsData) {
      const refName = dm.spec.ref.name;
      if (!refName) continue;
      const svcNs = dm.spec.ref.namespace || dm.metadata.namespace!;
      const key = `${dm.cluster}/${svcNs}/${refName}`;
      const isReady = dm.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True';
      const url = dm.status?.url || dm.status?.address?.url;
      if (isReady && url) {
        if (!domainMap[key]) domainMap[key] = [];
        if (!domainMap[key].includes(url)) domainMap[key].push(url);
      }
    }
    return domainMap;
  }, [domainMappingsData]);

  const ingressClassData = React.useMemo<IngressClassWithCluster[] | null>(() => {
    if (!configMaps) {
      return null;
    }

    const result: IngressClassWithCluster[] = [];

    clusters.forEach(cluster => {
      const cm = configMaps.find(
        item => item.cluster === cluster && item.metadata.name === 'config-network'
      );
      const raw =
        cm && cm.data && typeof cm.data['ingress.class'] === 'string'
          ? cm.data['ingress.class']
          : null;
      const trimmed = raw?.trim();
      result.push({
        cluster,
        ingressClass: trimmed && trimmed !== '' ? trimmed : null,
      });
    });

    return result;
  }, [clusters, configMaps]);

  const ingressClasses = React.useMemo(
    () =>
      ingressClassData?.map(({ cluster, ingressClass }) => {
        const formatted = formatIngressClass(ingressClass);
        const isGatewayApi = ingressClass === INGRESS_CLASS_GATEWAY_API;
        const isSet = ingressClass !== null;

        const color: 'default' | 'success' | 'warning' = isGatewayApi
          ? 'success'
          : isSet
          ? 'default'
          : 'warning';

        const variant: 'filled' | 'outlined' = isSet ? 'filled' : 'outlined';

        const label = clusters.length > 1 ? `${cluster}: ${formatted}` : formatted;

        return {
          key: cluster,
          label,
          color,
          variant,
        };
      }) || [],
    [ingressClassData, clusters]
  );

  const ingressClassLabel = React.useMemo(() => {
    if (!ingressClassData || ingressClassData.length <= 1) {
      return 'Ingress class';
    }
    return 'Ingress classes';
  }, [ingressClassData]);

  const columns = React.useMemo<
    (ResourceTableColumn<KService> | 'namespace' | 'cluster' | 'age')[]
  >(() => {
    const cols: (ResourceTableColumn<KService> | 'namespace' | 'cluster' | 'age')[] = [
      {
        id: 'name',
        label: 'Name',
        gridTemplate: 'auto',
        getValue: svc => svc.metadata?.name ?? '',
        render: svc => (
          <Link
            routeName="kserviceDetails"
            params={{
              namespace: svc.metadata.namespace,
              name: svc.metadata.name,
            }}
            activeCluster={svc.cluster}
          >
            {svc.metadata.name}
          </Link>
        ),
      },
      'namespace',
    ];

    if (showClusterColumn) {
      cols.push('cluster');
    }

    cols.push(
      {
        id: 'visibility',
        label: 'Visibility',
        gridTemplate: 'min-content',
        filterVariant: 'multi-select',
        filterSelectOptions: [
          { label: 'Internal', value: 'Internal' },
          { label: 'External', value: 'External' },
        ],
        getValue: svc => getVisibilityLabel(svc),
        render: svc => {
          const visibilityLabel = getVisibilityLabel(svc);
          return (
            <Chip
              label={visibilityLabel}
              color={visibilityLabel === 'Internal' ? 'default' : 'primary'}
              size="small"
            />
          );
        },
      },
      {
        id: 'url',
        label: 'URL',
        gridTemplate: '2fr',
        getValue: svc => {
          const [primary] = getServiceUrls(svc, domainByServiceKey);
          return (primary ?? '').toLowerCase();
        },
        render: svc => {
          const urls = getServiceUrls(svc, domainByServiceKey);

          if (urls.length > 0) {
            return (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                {urls.map(u => (
                  <a key={u} href={u} target="_blank" rel="noreferrer">
                    {u}
                  </a>
                ))}
              </Stack>
            );
          }

          if (svc.status?.url) {
            return (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <a href={svc.status.url} target="_blank" rel="noreferrer">
                  {svc.status.url}
                </a>
              </Stack>
            );
          }

          return (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          );
        },
      },
      {
        id: 'latestCreated',
        label: 'LatestCreated',
        gridTemplate: 'min-content',
        getValue: svc => {
          const revisionName = svc.status?.latestCreatedRevisionName;
          return revisionName ? revisionName.toLowerCase() : '';
        },
        render: svc => {
          const revisionName = svc.status?.latestCreatedRevisionName;
          if (!revisionName) {
            return (
              <Typography variant="body2" color="text.secondary">
                -
              </Typography>
            );
          }

          const shortName = getRevisionShort(svc, revisionName);
          return (
            <Typography variant="body2" title={revisionName}>
              {shortName}
            </Typography>
          );
        },
      },
      {
        id: 'latestReady',
        label: 'LatestReady',
        gridTemplate: 'min-content',
        getValue: svc => {
          const revisionName = svc.status?.latestReadyRevisionName;
          return revisionName ? revisionName.toLowerCase() : '';
        },
        render: svc => {
          const revisionName = svc.status?.latestReadyRevisionName;
          if (!revisionName) {
            return (
              <Typography variant="body2" color="text.secondary">
                -
              </Typography>
            );
          }

          const shortName = getRevisionShort(svc, revisionName);
          return (
            <Typography variant="body2" title={revisionName}>
              {shortName}
            </Typography>
          );
        },
      },
      {
        id: 'ready',
        label: 'Ready',
        gridTemplate: 'min-content',
        filterVariant: 'multi-select',
        filterSelectOptions: [
          { label: 'True', value: 'True' },
          { label: 'False', value: 'False' },
          { label: 'Unknown', value: 'Unknown' },
        ],
        getValue: svc => {
          const readyCondition = getReadyCondition(svc);
          return readyCondition?.status || 'Unknown';
        },
        render: svc => {
          const readyCondition = getReadyCondition(svc);
          const status = readyCondition?.status || 'Unknown';

          let color: 'success' | 'warning' | 'error' | 'default' = 'default';
          if (status === 'True') {
            color = 'success';
          } else if (status === 'False') {
            color = 'error';
          }

          return <Chip label={status} color={color} size="small" variant="outlined" />;
        },
      },
      {
        id: 'reason',
        label: 'Reason',
        gridTemplate: '2fr',
        getValue: svc => {
          const readyCondition = getReadyCondition(svc);
          return readyCondition?.reason?.toLowerCase() || '';
        },
        render: svc => {
          const readyCondition = getReadyCondition(svc);
          const reason = readyCondition?.reason;

          if (!reason) {
            return (
              <Typography variant="body2" color="text.secondary">
                -
              </Typography>
            );
          }

          return <Typography variant="body2">{reason}</Typography>;
        },
      },
      {
        id: 'traffic',
        label: 'Traffic',
        gridTemplate: '2fr',
        getValue: svc => trafficSummary(svc).toLowerCase(),
        render: svc => (
          <Typography variant="body2" color="text.secondary">
            {trafficSummary(svc) || '-'}
          </Typography>
        ),
      },
      {
        id: 'tags',
        label: 'Tags',
        gridTemplate: 'min-content',
        filterVariant: 'multi-select',
        getValue: svc => getTags(svc).join(',').toLowerCase(),
        render: svc => {
          const tags = getTags(svc);

          if (!tags.length) {
            return (
              <Typography variant="body2" color="text.secondary">
                -
              </Typography>
            );
          }

          return (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              {tags.map(tag => (
                <Chip key={tag} label={tag} size="small" />
              ))}
            </Stack>
          );
        },
      },
      'age'
    );

    return cols;
  }, [showClusterColumn, domainByServiceKey]);

  return (
    <ResourceListView
      title="KServices"
      headerProps={{
        noNamespaceFilter: false,
        subtitle: !ingressClassLoading && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', flexWrap: 'wrap', fontStyle: 'normal' }}
          >
            <Typography variant="body2" color="text.secondary">
              {ingressClassLabel}:
            </Typography>
            {ingressClasses.length > 0 ? (
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                {ingressClasses.map(item => (
                  <Chip
                    key={item.key}
                    label={item.label}
                    size="small"
                    color={item.color}
                    variant={item.variant}
                  />
                ))}
              </Stack>
            ) : (
              <Chip label={formatIngressClass(null)} size="small" variant="outlined" />
            )}
            {domainMappingsError && (
              <Chip
                label="Domain mappings unavailable"
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Stack>
        ),
        titleSideActions:
          clusters.length === 0
            ? undefined
            : [
                <CreateResourceButton
                  key="kservices-create-button"
                  resourceClass={KService}
                  resourceName="KService"
                />,
              ],
      }}
      resourceClass={KService}
      columns={columns}
      reflectInURL="knative-kservices"
      id="knative-kservices"
      actions={[
        {
          id: 'knative.kservice-actions',
          action: context => (
            <KServiceRowActions kservice={context.item as KService} closeMenu={context.closeMenu} />
          ),
        },
      ]}
    />
  );
}

export function KServicesList() {
  const clusters = useClusters();
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled(clusters);

  return isKnativeInstalled ? (
    <KServicesListContents clusters={clusters} />
  ) : (
    <NotInstalledBanner isLoading={isKnativeCheckLoading} />
  );
}
