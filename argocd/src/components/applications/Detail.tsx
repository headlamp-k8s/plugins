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

import { Icon } from '@iconify/react';
import {
  ActionButton,
  AuthVisible,
  DateLabel,
  DetailsGrid,
  Link,
  NameValueTable,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ConditionsTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Link as MuiLink, Tooltip, Typography } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import type { ComponentProps, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { refreshApplication, syncApplication } from '../../api/argoClient';
import { useArgoOperation } from '../../hooks/useArgoOperation';
import { ArgoApplication, ManagedResource, RevisionHistory } from '../../resources/application';
import { getHealthIcon, getHealthStatus, getSyncIcon, getSyncStatus } from './statusHelpers';

type HeadlampStatus = ComponentProps<typeof StatusLabel>['status'];

interface StatusDistributionSegment {
  label: string;
  value: number;
  status: HeadlampStatus;
}

/**
 * Renders the detail view for an Argo CD Application.
 *
 * @param props - The component properties.
 * @param props.namespace - The namespace of the Argo CD Application. If omitted, parsed from route params.
 * @param props.name - The name of the Argo CD Application. If omitted, parsed from route params.
 * @returns The application detail view component.
 */
export default function ApplicationDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;
  const sync = useArgoOperation(syncApplication, 'Sync');
  const refresh = useArgoOperation(refreshApplication, 'Refresh');
  const anyLoading = sync.isLoading || refresh.isLoading;

  return (
    <DetailsGrid
      resourceType={ArgoApplication}
      name={name}
      namespace={namespace}
      withEvents
      actions={(app: ArgoApplication) =>
        app
          ? [
              {
                id: 'argocd-sync',
                action: (
                  <AuthVisible item={app} authVerb="patch">
                    <ActionButton
                      description={sync.isLoading ? 'Syncing...' : 'Sync'}
                      icon={sync.isLoading ? 'mdi:loading' : 'mdi:sync'}
                      onClick={() => sync.execute(app.metadata.name, app.metadata.namespace)}
                      iconButtonProps={{ disabled: anyLoading }}
                    />
                  </AuthVisible>
                ),
              },
              {
                id: 'argocd-refresh',
                action: (
                  <AuthVisible item={app} authVerb="patch">
                    <ActionButton
                      description={refresh.isLoading ? 'Refreshing...' : 'Refresh'}
                      icon={refresh.isLoading ? 'mdi:loading' : 'mdi:refresh'}
                      onClick={() => refresh.execute(app.metadata.name, app.metadata.namespace)}
                      iconButtonProps={{ disabled: anyLoading }}
                    />
                  </AuthVisible>
                ),
              },
            ]
          : []
      }
      extraInfo={() => []}
      extraSections={(app: ArgoApplication) =>
        app
          ? [
              getGitOpsSummarySection(app),
              getManagedResourcesSection(app),
              getSyncPolicySection(app),
              getSyncHistorySection(app),
              getConditionsSection(app),
            ].filter(Boolean)
          : []
      }
    />
  );
}

function getGitOpsSummarySection(app: ArgoApplication) {
  return {
    id: 'gitops-summary',
    section: (
      <SectionBox title="GitOps Summary">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <StatusLabel status={getSyncStatus(app.syncStatus)}>
            <Icon icon={getSyncIcon(app.syncStatus)} style={{ marginRight: '4px' }} />
            {app.syncStatus}
          </StatusLabel>
          <StatusLabel status={getHealthStatus(app.healthStatus)}>
            <Icon icon={getHealthIcon(app.healthStatus)} style={{ marginRight: '4px' }} />
            {app.healthStatus}
          </StatusLabel>
          <StatusLabel status="">
            <Icon icon="mdi:folder-outline" style={{ marginRight: '4px' }} />
            Project: {app.project}
          </StatusLabel>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(0, 1fr)' },
            gap: 2,
          }}
        >
          <SummaryPanel title="Source" icon="mdi:source-branch">
            {app.isMultiSource ? (
              <Box sx={{ display: 'grid', gap: 1 }}>
                {app.sources.map((source, index) => (
                  <SourceSummary key={`${source.repoURL}-${index}`} source={source} index={index} />
                ))}
              </Box>
            ) : (
              <SourceSummary source={app.sources[0]} />
            )}
          </SummaryPanel>
          <SummaryPanel title="Destination" icon="mdi:target">
            <SummaryRow label="Cluster" value={formatDestinationCluster(app.destinationServer)} />
            <SummaryRow label="Namespace" value={app.destinationNamespace} />
          </SummaryPanel>
        </Box>
      </SectionBox>
    ),
  };
}

function SummaryPanel(props: { title: string; icon: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        border: theme => `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        p: 1.5,
        minWidth: 0,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontWeight: 700, mb: 1 }}
      >
        <Icon icon={props.icon} width={18} height={18} />
        {props.title}
      </Typography>
      {props.children}
    </Box>
  );
}

function SourceSummary(props: {
  source: ArgoApplication['sources'][number] | undefined;
  index?: number;
}) {
  const source = props.source;

  return (
    <Box sx={{ display: 'grid', gap: 0.5 }}>
      {props.index !== undefined && (
        <Typography variant="caption" color="text.secondary">
          Source {props.index + 1}
        </Typography>
      )}
      <SummaryRow
        label="Repo"
        value={
          source?.repoURL ? (
            <MuiLink href={source.repoURL} target="_blank" rel="noopener noreferrer">
              {formatRepoName(source.repoURL)}
            </MuiLink>
          ) : (
            '-'
          )
        }
      />
      <SummaryRow label="Revision" value={source?.targetRevision ?? 'HEAD'} />
      <SummaryRow
        label={source?.chart ? 'Chart' : 'Path'}
        value={source?.path ?? source?.chart ?? '-'}
      />
    </Box>
  );
}

function SummaryRow(props: { label: string; value: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '120px minmax(0, 1fr)',
        gap: 1,
        alignItems: 'baseline',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {props.label}
      </Typography>
      <Typography variant="body2" component="div" sx={{ overflowWrap: 'anywhere' }}>
        {props.value}
      </Typography>
    </Box>
  );
}

function formatRepoName(repoURL: string) {
  try {
    const url = new URL(repoURL);
    return url.pathname.replace(/^\/|\.git$/g, '') || repoURL;
  } catch {
    return repoURL.replace(/^.*[:/](.+\/.+?)(?:\.git)?$/, '$1');
  }
}

function formatDestinationCluster(destination: string) {
  return destination === 'https://kubernetes.default.svc' ? 'in-cluster' : destination;
}

/**
 * Generates the extra section displaying the managed resources of the Application.
 *
 * @param app - The ArgoApplication instance.
 * @returns A section box definition containing the managed resources table, or null if no resources exist.
 */
function getManagedResourcesSection(app: ArgoApplication) {
  const resources = app.managedResources;
  if (!resources.length) return null;

  return {
    id: 'managed-resources',
    section: (
      <SectionBox title="Managed Resources">
        <ManagedResourcesOverview resources={resources} />
        <SimpleTable
          data={resources}
          columns={[
            {
              label: 'Kind',
              getter: (r: ManagedResource) => <ResourceKindLabel resource={r} />,
              sort: true,
            },
            {
              label: 'Name',
              getter: (r: ManagedResource) => getManagedResourceName(r),
              sort: true,
            },
            {
              label: 'Namespace',
              getter: (r: ManagedResource) => r.namespace ?? '-',
              sort: true,
            },
            {
              label: 'Sync',
              getter: (r: ManagedResource) => (
                <StatusLabel status={getSyncStatus(getManagedResourceSync(r))}>
                  <Icon
                    icon={getSyncIcon(getManagedResourceSync(r))}
                    style={{ marginRight: '4px' }}
                  />
                  {getManagedResourceSync(r)}
                </StatusLabel>
              ),
              sort: (a: ManagedResource, b: ManagedResource) =>
                getManagedResourceSync(a).localeCompare(getManagedResourceSync(b)),
            },
            {
              label: 'Health',
              getter: (r: ManagedResource) => (
                <StatusLabel status={getHealthStatus(getManagedResourceHealth(r))}>
                  <Icon
                    icon={getHealthIcon(getManagedResourceHealth(r))}
                    style={{ marginRight: '4px' }}
                  />
                  {getManagedResourceHealth(r)}
                </StatusLabel>
              ),
              sort: (a: ManagedResource, b: ManagedResource) =>
                getManagedResourceHealth(a).localeCompare(getManagedResourceHealth(b)),
            },
            {
              label: 'API',
              getter: (r: ManagedResource) => getManagedResourceApi(r),
              sort: true,
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

function ManagedResourcesOverview(props: { resources: ManagedResource[] }) {
  const resources = props.resources;
  const syncSegments = getDistribution(resources, getManagedResourceSync, [
    ['Synced', 'success'],
    ['OutOfSync', 'warning'],
    ['Unknown', ''],
  ]);
  const healthSegments = getDistribution(resources, getManagedResourceHealth, [
    ['Healthy', 'success'],
    ['Progressing', 'info'],
    ['Suspended', 'warning'],
    ['Degraded', 'error'],
    ['Missing', 'error'],
    ['Unknown', ''],
  ]);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        gap: 2,
        mb: 2,
      }}
    >
      <ResourceDistribution
        title="Sync Distribution"
        total={resources.length}
        segments={syncSegments}
      />
      <ResourceDistribution
        title="Health Distribution"
        total={resources.length}
        segments={healthSegments}
      />
    </Box>
  );
}

function ResourceDistribution(props: {
  title: string;
  total: number;
  segments: StatusDistributionSegment[];
}) {
  const visibleSegments = props.segments.filter(segment => segment.value > 0);

  return (
    <Box
      sx={{
        border: theme => `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
      }}
    >
      <Box
        aria-hidden
        sx={theme => ({
          width: 54,
          height: 54,
          borderRadius: '50%',
          background: getDistributionBackground(visibleSegments, theme),
          flex: '0 0 auto',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 12,
            borderRadius: '50%',
            bgcolor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
          },
        })}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {props.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {props.total} managed {props.total === 1 ? 'resource' : 'resources'}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
          {visibleSegments.map(segment => (
            <StatusLabel key={segment.label} status={segment.status}>
              {segment.label}: {segment.value}
            </StatusLabel>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function getDistribution(
  resources: ManagedResource[],
  getValue: (resource: ManagedResource) => string,
  statuses: Array<[label: string, status: HeadlampStatus]>
): StatusDistributionSegment[] {
  return statuses.map(([label, status]) => ({
    label,
    status,
    value: resources.filter(resource => getValue(resource) === label).length,
  }));
}

function getDistributionBackground(segments: StatusDistributionSegment[], theme: Theme) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  if (!total) {
    return theme.palette.action.disabledBackground;
  }

  let offset = 0;
  const stops = segments.map(segment => {
    const start = offset;
    const end = offset + (segment.value / total) * 100;
    offset = end;
    const color = getSegmentColor(segment.status, theme);
    return `${color} ${start}% ${end}%`;
  });

  return `conic-gradient(${stops.join(', ')})`;
}

function getSegmentColor(status: HeadlampStatus, theme: Theme) {
  switch (status) {
    case 'success':
      return theme.palette.success.main;
    case 'warning':
      return theme.palette.warning.main;
    case 'error':
      return theme.palette.error.main;
    case 'info':
      return theme.palette.info.main;
    default:
      return theme.palette.grey[500];
  }
}

function getManagedResourceSync(resource: ManagedResource) {
  return resource.status || 'Unknown';
}

function getManagedResourceHealth(resource: ManagedResource) {
  return resource.health?.status || 'Unknown';
}

function getManagedResourceApi(resource: ManagedResource) {
  return resource.group ? `${resource.group}/${resource.version}` : resource.version || '-';
}

function getManagedResourceName(resource: ManagedResource) {
  const routeName = getManagedResourceRoute(resource);
  if (!routeName || !resource.namespace) {
    return resource.name;
  }

  return (
    <Link routeName={routeName} params={{ namespace: resource.namespace, name: resource.name }}>
      {resource.name}
    </Link>
  );
}

function getManagedResourceRoute(resource: ManagedResource) {
  switch (resource.kind) {
    case 'Deployment':
      return 'deployment';
    case 'Service':
      return 'service';
    case 'Pod':
      return 'pod';
    default:
      return null;
  }
}

function ResourceKindLabel(props: { resource: ManagedResource }) {
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      <Icon icon={getManagedResourceKindIcon(props.resource.kind)} width={18} height={18} />
      {props.resource.kind}
    </Box>
  );
}

function getManagedResourceKindIcon(kind: string) {
  switch (kind) {
    case 'Deployment':
      return 'mdi:kubernetes';
    case 'Service':
      return 'mdi:lan';
    case 'Pod':
      return 'mdi:cube-outline';
    default:
      return 'mdi:file-tree';
  }
}

function getSyncHistorySection(app: ArgoApplication) {
  const history = [...app.syncHistory].sort(compareHistoryEntries);

  return {
    id: 'sync-history',
    section: (
      <SectionBox title="Sync History">
        {history.length ? (
          <SimpleTable
            data={history}
            columns={[
              {
                label: 'ID',
                getter: (entry: RevisionHistory) => entry.id ?? '-',
                sort: true,
              },
              {
                label: 'Revision',
                getter: (entry: RevisionHistory) => <RevisionLabel entry={entry} />,
                sort: (entry: RevisionHistory) => getHistoryRevision(entry),
              },
              {
                label: 'Deployed',
                getter: (entry: RevisionHistory) =>
                  entry.deployedAt ? <DateLabel date={entry.deployedAt} /> : '-',
                sort: (entry: RevisionHistory) => entry.deployedAt ?? '',
              },
              {
                label: 'Started',
                getter: (entry: RevisionHistory) =>
                  entry.deployStartedAt ? <DateLabel date={entry.deployStartedAt} /> : '-',
                sort: (entry: RevisionHistory) => entry.deployStartedAt ?? '',
              },
              {
                label: 'Source',
                getter: (entry: RevisionHistory) => getHistorySource(entry),
                sort: true,
              },
              {
                label: 'Initiated By',
                getter: (entry: RevisionHistory) => getHistoryInitiator(entry),
                sort: true,
              },
            ]}
          />
        ) : (
          <Box
            sx={{
              border: theme => `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              p: 2,
            }}
          >
            <Typography color="text.secondary">
              No sync history recorded yet. Argo CD records history after sync operations.
            </Typography>
          </Box>
        )}
      </SectionBox>
    ),
  };
}

function compareHistoryEntries(first: RevisionHistory, second: RevisionHistory) {
  const firstTime = Date.parse(first.deployedAt || first.deployStartedAt || '') || 0;
  const secondTime = Date.parse(second.deployedAt || second.deployStartedAt || '') || 0;

  if (firstTime !== secondTime) {
    return secondTime - firstTime;
  }

  return (second.id ?? 0) - (first.id ?? 0);
}

function RevisionLabel(props: { entry: RevisionHistory }) {
  const revision = getHistoryRevision(props.entry);
  if (revision === '-') {
    return '-';
  }

  return (
    <Tooltip title={revision}>
      <Box component="span" sx={{ fontFamily: 'monospace' }}>
        {revision.length > 12 ? revision.slice(0, 7) : revision}
      </Box>
    </Tooltip>
  );
}

function getHistoryRevision(entry: RevisionHistory) {
  if (entry.revisions?.length) {
    return entry.revisions.length === 1
      ? entry.revisions[0]
      : `${entry.revisions.length} revisions`;
  }

  return entry.revision || '-';
}

function getHistorySource(entry: RevisionHistory) {
  const sources = entry.sources ?? (entry.source ? [entry.source] : []);
  if (sources.length > 1) {
    return `${sources.length} sources`;
  }

  const source = sources[0];
  if (!source) {
    return '-';
  }

  return source.path || source.chart || formatRepoName(source.repoURL);
}

function getHistoryInitiator(entry: RevisionHistory) {
  if (entry.initiatedBy?.automated) {
    return 'Automated';
  }

  return entry.initiatedBy?.username || 'Unknown';
}

/**
 * Generates the extra section displaying the sync policy configuration of the Application.
 *
 * @param app - The ArgoApplication instance.
 * @returns A section box definition containing the sync policy details.
 */
function getSyncPolicySection(app: ArgoApplication) {
  const policy = app.syncPolicy;
  const automated = policy?.automated;
  const hasAutomatedPolicy = !!automated;
  const isAutoSyncEnabled = hasAutomatedPolicy && automated.enabled !== false;
  const automatedMode = hasAutomatedPolicy
    ? isAutoSyncEnabled
      ? 'Enabled'
      : 'Disabled'
    : 'Manual';

  const chips = [
    {
      label: 'Automated Sync',
      value: automatedMode,
      status: isAutoSyncEnabled ? 'success' : hasAutomatedPolicy ? 'error' : 'warning',
      muted: false,
      icon: isAutoSyncEnabled
        ? 'mdi:sync-circle'
        : hasAutomatedPolicy
        ? 'mdi:sync-off'
        : 'mdi:hand-back-right',
    },
    {
      label: 'Self Heal',
      value: automated?.selfHeal ? 'Enabled' : 'Disabled',
      status: automated?.selfHeal ? 'success' : '',
      muted: !automated?.selfHeal,
      icon: automated?.selfHeal ? 'mdi:heart-pulse' : 'mdi:heart-off',
    },
    {
      label: 'Prune',
      value: automated?.prune ? 'Enabled' : 'Disabled',
      status: automated?.prune ? 'success' : '',
      muted: !automated?.prune,
      icon: automated?.prune ? 'mdi:delete-sweep' : 'mdi:delete-off',
    },
    {
      label: 'Allow Empty',
      value: automated?.allowEmpty ? 'Enabled' : 'Disabled',
      status: automated?.allowEmpty ? 'warning' : '',
      muted: !automated?.allowEmpty,
      icon: automated?.allowEmpty ? 'mdi:alert-circle' : 'mdi:shield-check',
    },
  ] satisfies Array<{
    label: string;
    value: string;
    status: HeadlampStatus;
    muted: boolean;
    icon: string;
  }>;

  const rows = [
    { name: 'Retry Limit', value: policy?.retry?.limit ?? 'Default' },
    {
      name: 'Retry Backoff',
      value: policy?.retry?.backoff
        ? `${policy.retry.backoff.duration ?? 'Default'} (max ${
            policy.retry.backoff.maxDuration ?? 'Default'
          })`
        : 'Default',
    },
    { name: 'Retry Factor', value: policy?.retry?.backoff?.factor ?? 'Default' },
    {
      name: 'Sync Options',
      value: policy?.syncOptions?.length ? policy.syncOptions.join(', ') : 'None configured',
    },
  ];

  return {
    id: 'sync-policy',
    section: (
      <SectionBox title="Sync Policy">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {chips.map(chip => (
            <PolicyStatusChip
              key={chip.label}
              label={chip.label}
              value={chip.value}
              status={chip.status}
              muted={chip.muted}
              icon={chip.icon}
            />
          ))}
        </Box>
        <NameValueTable rows={rows} />
      </SectionBox>
    ),
  };
}

function PolicyStatusChip(props: {
  label: string;
  value: string;
  status: HeadlampStatus;
  muted: boolean;
  icon: string;
}) {
  return (
    <StatusLabel
      status={props.status}
      sx={
        props.muted
          ? {
              bgcolor: 'action.hover',
              color: 'text.secondary',
              border: theme => `1px solid ${theme.palette.divider}`,
            }
          : undefined
      }
    >
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        <Icon icon={props.icon} width={16} height={16} />
        <Box component="span">{props.label}:</Box>
        <Box component="span" sx={{ fontWeight: props.muted ? 600 : 700 }}>
          {props.value}
        </Box>
      </Box>
    </StatusLabel>
  );
}

/**
 * Generates the extra section displaying the warning and error conditions of the Application.
 *
 * @param app - The ArgoApplication instance.
 * @returns A section box definition containing the conditions table, or null if no conditions exist.
 */
function getConditionsSection(app: ArgoApplication) {
  const conditions = app.conditions;
  if (!conditions.length) return null;

  return {
    id: 'conditions',
    section: (
      <SectionBox title="Conditions">
        <ConditionsTable resource={app.jsonData} />
      </SectionBox>
    ),
  };
}
