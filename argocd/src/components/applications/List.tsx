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
  AuthVisible,
  ResourceListView,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { refreshApplication, syncApplication } from '../../api/argoClient';
import { useArgoOperationMap } from '../../hooks/useArgoOperation';
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
                  description={isLoadingSync ? 'Syncing…' : 'Sync'}
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
                  description={isLoadingRefresh ? 'Refreshing…' : 'Refresh'}
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
        'namespace',
        {
          id: 'project',
          label: 'Project',
          getValue: (app: ArgoApplication) => app.project,
        },
        {
          id: 'source-repo',
          label: 'Source Repo',
          getValue: (app: ArgoApplication) =>
            app.isMultiSource ? `${app.sources.length} sources` : app.repoURL,
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
