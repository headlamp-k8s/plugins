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

import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ArgoAppProject } from '../../resources/appproject';

export default function AppProjectList() {
  return (
    <ResourceListView
      title="Argo CD Projects"
      resourceClass={ArgoAppProject}
      columns={[
        'name',
        'namespace',
        {
          id: 'description',
          label: 'Description',
          getValue: (project: ArgoAppProject) => project.description || '-',
        },
        {
          id: 'source-repos',
          label: 'Source Repos',
          getValue: (project: ArgoAppProject) => String(project.sourceRepos.length),
        },
        {
          id: 'destinations',
          label: 'Destinations',
          getValue: (project: ArgoAppProject) => String(project.destinations.length),
        },
        'age',
      ]}
    />
  );
}
