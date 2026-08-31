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
import { ArgoApplicationSet } from '../../resources/applicationset';

function destinationLabel(applicationSet: ArgoApplicationSet): string {
  const destination = applicationSet.templateDestination;
  if (!destination) return '-';
  return (
    [destination.name ?? destination.server, destination.namespace].filter(Boolean).join(' · ') ||
    '-'
  );
}

/** Inventory only: ApplicationSets intentionally expose no mutation controls. */
export default function ApplicationSetList() {
  return (
    <ResourceListView
      title="Argo CD ApplicationSets"
      resourceClass={ArgoApplicationSet}
      headerProps={{ titleSideActions: [] }}
      enableRowActions={false}
      enableRowSelection={false}
      columns={[
        'name',
        'namespace',
        {
          id: 'generators',
          label: 'Generators',
          getValue: (applicationSet: ArgoApplicationSet) =>
            applicationSet.generatorSummaries.join(', ') || '-',
        },
        {
          id: 'template-project',
          label: 'Template Project',
          getValue: (applicationSet: ArgoApplicationSet) => applicationSet.templateProject,
        },
        {
          id: 'template-destination',
          label: 'Template Destination',
          getValue: destinationLabel,
        },
        {
          id: 'generated-applications',
          label: 'Generated Applications',
          getValue: (applicationSet: ArgoApplicationSet) =>
            applicationSet.generatedApplicationCount === undefined
              ? '—'
              : String(applicationSet.generatedApplicationCount),
        },
        'age',
      ]}
    />
  );
}
