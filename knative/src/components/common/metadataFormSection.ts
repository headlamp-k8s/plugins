/*
 * Copyright 2026 The Kubernetes Authors
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

import type { FormSection } from '@kinvolk/headlamp-plugin/lib/CommonComponents';

/**
 * Builds the Metadata section of a create form: name, namespace and labels, as in Headlamp's own
 * forms, except that the namespace is required, because the form looks up objects in it.
 *
 * @returns The section.
 */
export function metadataFormSection(): FormSection {
  return {
    title: 'Metadata',
    fields: [
      { key: 'name', path: 'metadata.name', label: 'Name', required: true },
      {
        key: 'namespace',
        path: 'metadata.namespace',
        label: 'Namespace',
        type: 'namespace',
        required: true,
      },
      { key: 'labels', path: 'metadata.labels', label: 'Labels', type: 'labels' },
    ],
  };
}
