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
  ResourceListView,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { refreshApplication, syncApplication } from '../../api/argoClient';
import { ArgoApplication } from '../../resources/application';
import { getHealthStatus, getSyncStatus } from './statusHelpers';

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
  const { enqueueSnackbar } = useSnackbar();
  const [loadingApps, setLoadingApps] = useState<Record<string, 'sync' | 'refresh'>>({});

  /** Triggers a Kubernetes-native sync of the given application. */
  const handleSync = async (app: ArgoApplication) => {
    const key = `${app.metadata.namespace}/${app.metadata.name}`;
    if (loadingApps[key]) return;
    setLoadingApps(prev => ({ ...prev, [key]: 'sync' }));
    try {
      await syncApplication(app.metadata.name, app.metadata.namespace);
      enqueueSnackbar(`Sync triggered for ${app.metadata.name}`, { variant: 'success' });
    } catch (error) {
      console.error(`Failed to sync ${app.metadata.name}:`, error);
      enqueueSnackbar(
        `Failed to sync ${app.metadata.name}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { variant: 'error' }
      );
    } finally {
      setLoadingApps(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  /** Requests a Kubernetes-native refresh of the given application. */
  const handleRefresh = async (app: ArgoApplication) => {
    const key = `${app.metadata.namespace}/${app.metadata.name}`;
    if (loadingApps[key]) return;
    setLoadingApps(prev => ({ ...prev, [key]: 'refresh' }));
    try {
      await refreshApplication(app.metadata.name, app.metadata.namespace);
      enqueueSnackbar(`Refresh requested for ${app.metadata.name}`, { variant: 'success' });
    } catch (error) {
      console.error(`Failed to refresh ${app.metadata.name}:`, error);
      enqueueSnackbar(
        `Failed to refresh ${app.metadata.name}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { variant: 'error' }
      );
    } finally {
      setLoadingApps(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  return (
    <ResourceListView
      title="Argo CD Applications"
      resourceClass={ArgoApplication}
      actions={[
        {
          id: 'argocd-sync',
          action: ({ item }: { item: ArgoApplication }) => {
            const key = `${item.metadata.namespace}/${item.metadata.name}`;
            const isLoading = loadingApps[key] === 'sync';
            return (
              <ActionButton
                description={isLoading ? 'Syncing…' : 'Sync'}
                icon={isLoading ? 'mdi:loading' : 'mdi:sync'}
                onClick={() => handleSync(item)}
                iconButtonProps={{ disabled: !!loadingApps[key] }}
              />
            );
          },
        },
        {
          id: 'argocd-refresh',
          action: ({ item }: { item: ArgoApplication }) => {
            const key = `${item.metadata.namespace}/${item.metadata.name}`;
            const isLoading = loadingApps[key] === 'refresh';
            return (
              <ActionButton
                description={isLoading ? 'Refreshing…' : 'Refresh'}
                icon={isLoading ? 'mdi:loading' : 'mdi:refresh'}
                onClick={() => handleRefresh(item)}
                iconButtonProps={{ disabled: !!loadingApps[key] }}
              />
            );
          },
        },
      ]}
      columns={[
        'name',
        'namespace',
        {
          id: 'project',
          label: 'Project',
          getValue: (app: ArgoApplication) => app.project,
        },
        {
          id: 'source-repo',
          label: 'Source Repo',
          getValue: (app: ArgoApplication) => app.repoURL,
        },
        {
          id: 'target-revision',
          label: 'Target Revision',
          getValue: (app: ArgoApplication) => app.targetRevision,
        },
        {
          id: 'sync-status',
          label: 'Sync Status',
          getValue: (app: ArgoApplication) => app.syncStatus,
          render: (app: ArgoApplication) => (
            <StatusLabel status={getSyncStatus(app.syncStatus)}>{app.syncStatus}</StatusLabel>
          ),
        },
        {
          id: 'health-status',
          label: 'Health Status',
          getValue: (app: ArgoApplication) => app.healthStatus,
          render: (app: ArgoApplication) => (
            <StatusLabel status={getHealthStatus(app.healthStatus)}>{app.healthStatus}</StatusLabel>
          ),
        },
        'age',
      ]}
    />
  );
}
