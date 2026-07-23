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
  DetailsGrid,
  NameValueTable,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ConditionsTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { refreshApplication, syncApplication } from '../../api/argoClient';
import { useArgoOperation } from '../../hooks/useArgoOperation';
import { ArgoApplication, ManagedResource } from '../../resources/application';
import { getHealthStatus, getSyncStatus } from './statusHelpers';

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
                      description={sync.isLoading ? 'Syncing…' : 'Sync'}
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
                      description={refresh.isLoading ? 'Refreshing…' : 'Refresh'}
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
      extraInfo={(app: ArgoApplication) =>
        app
          ? [
              {
                name: 'Project',
                value: app.project,
              },
              ...(app.isMultiSource
                ? app.sources.flatMap((src, i) => [
                    { name: `Source ${i + 1} Repo`, value: src.repoURL },
                    { name: `Source ${i + 1} Revision`, value: src.targetRevision ?? 'HEAD' },
                    { name: `Source ${i + 1} Path`, value: src.path ?? src.chart ?? '-' },
                  ])
                : [
                    { name: 'Source Repo', value: app.repoURL },
                    { name: 'Target Revision', value: app.targetRevision },
                    { name: 'Path', value: app.path || '-' },
                  ]),
              {
                name: 'Destination',
                value: `${app.destinationServer} / ${app.destinationNamespace}`,
              },
              {
                name: 'Sync Status',
                value: (
                  <StatusLabel status={getSyncStatus(app.syncStatus)}>{app.syncStatus}</StatusLabel>
                ),
              },
              {
                name: 'Health Status',
                value: (
                  <StatusLabel status={getHealthStatus(app.healthStatus)}>
                    {app.healthStatus}
                  </StatusLabel>
                ),
              },
            ]
          : []
      }
      extraSections={(app: ArgoApplication) =>
        app
          ? [
              getManagedResourcesSection(app),
              getSyncPolicySection(app),
              getConditionsSection(app),
            ].filter(Boolean)
          : []
      }
    />
  );
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
        <SimpleTable
          data={resources}
          columns={[
            {
              label: 'Kind',
              getter: (r: ManagedResource) => r.kind,
              sort: true,
            },
            {
              label: 'Name',
              getter: (r: ManagedResource) => r.name,
              sort: true,
            },
            {
              label: 'Namespace',
              getter: (r: ManagedResource) => r.namespace ?? '-',
              sort: true,
            },
            {
              label: 'Status',
              getter: (r: ManagedResource) => r.status ?? '-',
            },
            {
              label: 'Health',
              getter: (r: ManagedResource) =>
                r.health?.status ? (
                  <StatusLabel status={getHealthStatus(r.health.status)}>
                    {r.health.status}
                  </StatusLabel>
                ) : (
                  '-'
                ),
              sort: (a: ManagedResource, b: ManagedResource) =>
                (a.health?.status ?? '').localeCompare(b.health?.status ?? ''),
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/**
 * Generates the extra section displaying the sync policy configuration of the Application.
 *
 * @param app - The ArgoApplication instance.
 * @returns A section box definition containing the sync policy details, or null if no sync policy is defined.
 */
function getSyncPolicySection(app: ArgoApplication) {
  const policy = app.syncPolicy;
  if (!policy) return null;

  const rows = [
    { name: 'Automated', value: policy.automated ? 'Yes' : 'No' },
    ...(policy.automated
      ? [
          { name: 'Self Heal', value: policy.automated.selfHeal ? 'Yes' : 'No' },
          { name: 'Prune', value: policy.automated.prune ? 'Yes' : 'No' },
        ]
      : []),
    ...(policy.retry
      ? [
          { name: 'Retry Limit', value: String(policy.retry.limit ?? '-') },
          {
            name: 'Retry Backoff',
            value: policy.retry.backoff
              ? `${policy.retry.backoff.duration ?? '-'} (max ${
                  policy.retry.backoff.maxDuration ?? '-'
                })`
              : '-',
          },
        ]
      : []),
    ...(policy.syncOptions?.length
      ? [{ name: 'Sync Options', value: policy.syncOptions.join(', ') }]
      : []),
  ];

  return {
    id: 'sync-policy',
    section: (
      <SectionBox title="Sync Policy">
        <NameValueTable rows={rows} />
      </SectionBox>
    ),
  };
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
