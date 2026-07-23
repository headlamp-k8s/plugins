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
  DetailsGrid,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import {
  AppProjectDestination,
  AppProjectRole,
  ArgoAppProject,
  GroupKind,
} from '../../resources/appproject';

export default function AppProjectDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <DetailsGrid
      resourceType={ArgoAppProject}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={(project: ArgoAppProject) =>
        project
          ? [
              { name: 'Description', value: project.description || '-' },
              { name: 'Source Repos', value: String(project.sourceRepos.length) },
              { name: 'Destinations', value: String(project.destinations.length) },
            ]
          : []
      }
      extraSections={(project: ArgoAppProject) =>
        project
          ? [
              getSourceReposSection(project),
              getDestinationsSection(project),
              getClusterResourceWhitelistSection(project),
              getRolesSection(project),
            ].filter(Boolean)
          : []
      }
    />
  );
}

function getSourceReposSection(project: ArgoAppProject) {
  const repos = project.sourceRepos;
  if (!repos.length) return null;

  return {
    id: 'source-repos',
    section: (
      <SectionBox title="Source Repositories">
        <NameValueTable rows={repos.map((repo, i) => ({ name: `Repo ${i + 1}`, value: repo }))} />
      </SectionBox>
    ),
  };
}

function getDestinationsSection(project: ArgoAppProject) {
  const destinations = project.destinations;
  if (!destinations.length) return null;

  return {
    id: 'destinations',
    section: (
      <SectionBox title="Destinations">
        <SimpleTable
          data={destinations}
          columns={[
            {
              label: 'Server',
              getter: (d: AppProjectDestination) => d.server ?? d.name ?? '-',
            },
            {
              label: 'Namespace',
              getter: (d: AppProjectDestination) => d.namespace ?? '*',
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

function getClusterResourceWhitelistSection(project: ArgoAppProject) {
  const whitelist = project.clusterResourceWhitelist;
  if (!whitelist.length) return null;

  return {
    id: 'cluster-resource-whitelist',
    section: (
      <SectionBox title="Cluster Resource Whitelist">
        <SimpleTable
          data={whitelist}
          columns={[
            { label: 'Group', getter: (gk: GroupKind) => gk.group || '*' },
            { label: 'Kind', getter: (gk: GroupKind) => gk.kind || '*' },
          ]}
        />
      </SectionBox>
    ),
  };
}

function getRolesSection(project: ArgoAppProject) {
  const roles = project.roles;
  if (!roles.length) return null;

  return {
    id: 'roles',
    section: (
      <SectionBox title="Roles">
        <SimpleTable
          data={roles}
          columns={[
            { label: 'Name', getter: (r: AppProjectRole) => r.name },
            { label: 'Description', getter: (r: AppProjectRole) => r.description ?? '-' },
            {
              label: 'Groups',
              getter: (r: AppProjectRole) => r.groups?.join(', ') ?? '-',
            },
          ]}
        />
      </SectionBox>
    ),
  };
}
