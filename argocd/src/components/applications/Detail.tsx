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

import { DetailsGrid, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { ArgoApplication } from '../../resources/application';
import { getHealthStatus, getSyncStatus } from './statusHelpers';

/**
 * Detail page for a single Argo CD Application.
 *
 * Uses Headlamp's {@link DetailsGrid} to render standard metadata plus
 * Argo CD-specific fields (project, source, sync and health status).
 */
export default function ApplicationDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <DetailsGrid
      resourceType={ArgoApplication}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={(app: ArgoApplication) =>
        app
          ? [
              {
                name: 'Project',
                value: app.project,
              },
              {
                name: 'Source Repo',
                value: app.repoURL,
              },
              {
                name: 'Target Revision',
                value: app.targetRevision,
              },
              {
                name: 'Path',
                value: app.path || '-',
              },
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
    />
  );
}
