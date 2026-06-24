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

import { ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ArgoApplication } from '../../resources/application';

/**
 * Maps an Argo CD health status string to a Headlamp StatusLabel severity.
 *
 * @param health - The health status string from the Application resource
 *   (e.g., "Healthy", "Degraded", "Progressing", "Suspended", "Missing").
 * @returns A StatusLabel status string: "success", "warning", "info", "error",
 *   or "" for unknown values.
 */
function getHealthStatus(health: string): string {
  switch (health.toLowerCase()) {
    case 'healthy':
      return 'success';
    case 'suspended':
      return 'warning';
    case 'progressing':
      return 'info';
    case 'degraded':
    case 'missing':
      return 'error';
    default:
      return '';
  }
}

/**
 * Maps an Argo CD sync status string to a Headlamp StatusLabel severity.
 *
 * @param sync - The sync status string from the Application resource
 *   (e.g., "Synced", "OutOfSync").
 * @returns A StatusLabel status string: "success", "warning",
 *   or "" for unknown values.
 */
function getSyncStatus(sync: string): string {
  switch (sync.toLowerCase()) {
    case 'synced':
      return 'success';
    case 'outofsync':
      return 'warning';
    default:
      return '';
  }
}

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
  return (
    <ResourceListView
      title="Argo CD Applications"
      resourceClass={ArgoApplication}
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
