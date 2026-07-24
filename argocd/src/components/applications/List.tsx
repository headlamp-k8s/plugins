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
  Link,
  ResourceListView,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Link as MuiLink, Tooltip, Typography } from '@mui/material';
import { refreshApplication, syncApplication } from '../../api/argoClient';
import { useArgoOperationMap } from '../../hooks/useArgoOperation';
import { ArgoApplication } from '../../resources/application';
import { getHealthIcon, getHealthStatus, getSyncIcon, getSyncStatus } from './statusHelpers';

/**
 * Renders a table of all Argo CD Application resources in the current cluster.
 *
 * Uses Headlamp's built-in {@link ResourceListView} component to display
 * applications with custom columns for project, source repository,
 * sync status, and health status. Status columns are rendered as
 * color-coded badges using {@link StatusLabel}.
 *
 * @returns The Application list view React element.
 */
export default function ApplicationList() {
  const sync = useArgoOperationMap(syncApplication, 'Sync');
  const refresh = useArgoOperationMap(refreshApplication, 'Refresh');

  return (
    <ResourceListView
      title="Argo CD Applications"
      resourceClass={ArgoApplication}
      actions={[
        {
          id: 'argocd-sync',
          action: ({ item }: { item: ArgoApplication }) => {
            const { name, namespace } = item.metadata;
            const isLoadingSync = sync.isLoading(name, namespace);
            const isLoadingAny = isLoadingSync || refresh.isLoading(name, namespace);
            return (
              <AuthVisible item={item} authVerb="patch">
                <ActionButton
                  description={isLoadingSync ? 'Syncing...' : 'Sync'}
                  icon={isLoadingSync ? 'mdi:loading' : 'mdi:sync'}
                  onClick={() => sync.execute(name, namespace)}
                  iconButtonProps={{ disabled: isLoadingAny }}
                />
              </AuthVisible>
            );
          },
        },
        {
          id: 'argocd-refresh',
          action: ({ item }: { item: ArgoApplication }) => {
            const { name, namespace } = item.metadata;
            const isLoadingRefresh = refresh.isLoading(name, namespace);
            const isLoadingAny = isLoadingRefresh || sync.isLoading(name, namespace);
            return (
              <AuthVisible item={item} authVerb="patch">
                <ActionButton
                  description={isLoadingRefresh ? 'Refreshing...' : 'Refresh'}
                  icon={isLoadingRefresh ? 'mdi:loading' : 'mdi:refresh'}
                  onClick={() => refresh.execute(name, namespace)}
                  iconButtonProps={{ disabled: isLoadingAny }}
                />
              </AuthVisible>
            );
          },
        },
      ]}
      columns={[
        'name',
        {
          id: 'project',
          label: 'Project',
          getValue: (app: ArgoApplication) => app.project,
        },
        {
          id: 'source-repo',
          label: 'Source',
          getValue: (app: ArgoApplication) =>
            app.isMultiSource
              ? `${app.sources.length} sources`
              : `${getRepoDisplayName(app.repoURL)} ${app.targetRevision}`,
          render: (app: ArgoApplication) => <SourceAndRevisionLabel app={app} />,
        },
        {
          id: 'app-flow',
          label: 'Namespaces',
          getValue: (app: ArgoApplication) =>
            `${app.metadata.namespace} -> ${getDestinationLabel(app)}`,
          render: (app: ArgoApplication) => <ApplicationFlow app={app} />,
        },
        {
          id: 'status',
          label: 'Status',
          getValue: (app: ArgoApplication) => `${app.syncStatus} ${app.healthStatus}`,
          render: (app: ArgoApplication) => <ApplicationStatus app={app} />,
        },
        'age',
      ]}
    />
  );
}

function ApplicationFlow(props: { app: ArgoApplication }) {
  const app = props.app;
  const destination = getDestinationLabel(app);
  const shouldLinkDestination = isLocalDestination(app);

  return (
    <Tooltip
      title={`Application namespace: ${app.metadata.namespace}\nDestination namespace: ${destination}`}
    >
      <Box sx={{ display: 'grid', gap: 0.25, minWidth: 0 }}>
        <Typography component="span" variant="body2" sx={{ whiteSpace: 'nowrap' }}>
          <Box component="span" color="text.secondary">
            App:
          </Box>{' '}
          <Link routeName="namespace" params={{ name: app.metadata.namespace }}>
            {app.metadata.namespace}
          </Link>
        </Typography>
        <Typography component="span" variant="body2" sx={{ whiteSpace: 'nowrap' }}>
          <Box component="span" color="text.secondary">
            Dest:
          </Box>{' '}
          {shouldLinkDestination ? (
            <Link routeName="namespace" params={{ name: app.destinationNamespace }}>
              {app.destinationNamespace}
            </Link>
          ) : (
            destination
          )}
        </Typography>
      </Box>
    </Tooltip>
  );
}

function ApplicationStatus(props: { app: ArgoApplication }) {
  const app = props.app;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
      <StatusLabel status={getSyncStatus(app.syncStatus)}>
        <Icon icon={getSyncIcon(app.syncStatus)} style={{ marginRight: '4px' }} />
        {app.syncStatus}
      </StatusLabel>
      <StatusLabel status={getHealthStatus(app.healthStatus)}>
        <Icon icon={getHealthIcon(app.healthStatus)} style={{ marginRight: '4px' }} />
        {app.healthStatus}
      </StatusLabel>
    </Box>
  );
}

function SourceAndRevisionLabel(props: { app: ArgoApplication }) {
  const app = props.app;

  if (app.isMultiSource) {
    return (
      <Tooltip
        title={app.sources
          .map(
            (source, index) =>
              `Source ${index + 1}: ${source.repoURL || '-'} @ ${source.targetRevision || 'HEAD'}`
          )
          .join('\n')}
      >
        <Box sx={{ display: 'grid', gap: 0.25, minWidth: 0 }}>
          <Typography variant="body2">{app.sources.length} sources</Typography>
          <Typography variant="caption" color="text.secondary">
            Multiple revisions
          </Typography>
        </Box>
      </Tooltip>
    );
  }

  if (!app.repoURL) {
    return '-';
  }

  return (
    <Tooltip title={app.repoURL}>
      <Box sx={{ display: 'grid', gap: 0.25, minWidth: 0 }}>
        <MuiLink
          href={app.repoURL}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ overflowWrap: 'anywhere' }}
        >
          {getRepoDisplayName(app.repoURL)}
        </MuiLink>
        <Typography variant="caption" color="text.secondary">
          Revision: {app.targetRevision}
        </Typography>
      </Box>
    </Tooltip>
  );
}

function getRepoDisplayName(repoURL: string) {
  if (!repoURL) {
    return '-';
  }

  const repoPath = repoURL.replace(/\/$/, '').split('/').pop() || repoURL;
  return repoPath.replace(/\.git$/, '');
}

function getDestinationLabel(app: ArgoApplication) {
  const namespace = app.destinationNamespace;
  const cluster = app.spec.destination?.name;

  if (cluster) {
    return `${cluster} / ${namespace}`;
  }

  return namespace;
}

function isLocalDestination(app: ArgoApplication) {
  const destination = app.spec.destination;

  return (
    !destination?.name &&
    (!destination?.server || destination.server === 'https://kubernetes.default.svc')
  );
}
