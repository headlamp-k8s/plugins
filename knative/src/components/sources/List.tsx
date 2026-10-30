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

import {
  getKnativeSourceClass,
  KnativeSource,
  SOURCE_CRD_LABEL_SELECTOR,
} from '../../resources/knative';
import { KNATIVE_SOURCE_KINDS } from '../../resources/knative/eventingData';
import { destinationColumn } from '../common/DestinationLink';
import { type DiscoveredKindsColumns, DiscoveredKindsList } from '../common/DiscoveredKindsList';
import { getReadinessColumns } from '../common/ResourceListCells';

/**
 * Builds the columns of the Sources list.
 *
 * @param showClusterColumn - Whether more than one cluster is selected.
 * @returns The columns.
 */
function sourceColumns(showClusterColumn: boolean): DiscoveredKindsColumns<KnativeSource> {
  return [
    'name',
    'namespace',
    ...(showClusterColumn ? (['cluster'] as const) : []),
    'kind',
    destinationColumn('sink', 'Sink', item => item.sink),
    ...getReadinessColumns<KnativeSource>(),
    'age',
  ];
}

/**
 * Lists the Knative Sources of every kind in the selected clusters: the kinds labelled
 * `duck.knative.dev/source=true`, Knative's own and those of other projects, or Knative's own
 * kinds where the CRDs cannot be listed.
 *
 * @returns The Sources list, or a banner when Knative Eventing is not installed.
 */
export function SourcesList() {
  return (
    <DiscoveredKindsList
      title="Sources"
      id="knative-sources"
      labelSelector={SOURCE_CRD_LABEL_SELECTOR}
      fallbackKinds={KNATIVE_SOURCE_KINDS}
      getKindClass={getKnativeSourceClass}
      columns={sourceColumns}
      kindLabel="Source"
    />
  );
}
