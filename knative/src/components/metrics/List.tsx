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
  ResourceListView,
  ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useClusters } from '../../hooks/useClusters';
import { useKnativeInstalled } from '../../hooks/useKnativeInstalled';
import { KnativeMetric } from '../../resources/knative';
import { formatNanoseconds } from '../../utils/servingResources';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import {
  getReadinessColumns,
  NamespacedResourceLink,
  TextValue,
} from '../common/ResourceListCells';

export function MetricsList() {
  const clusters = useClusters();
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled('serving', clusters);
  const showClusterColumn = clusters.length > 1;
  const columns = React.useMemo<
    (ResourceTableColumn<KnativeMetric> | 'name' | 'namespace' | 'cluster' | 'age')[]
  >(
    () => [
      'name',
      'namespace',
      ...(showClusterColumn ? (['cluster'] as const) : []),
      {
        id: 'revision',
        label: 'Revision',
        getValue: item => item.revisionName || '',
        render: item => (
          <NamespacedResourceLink
            routeName="revisionDetails"
            name={item.revisionName}
            namespace={item.metadata.namespace}
            cluster={item.cluster}
          />
        ),
      },
      {
        id: 'scrape-target',
        label: 'Scrape Target',
        getValue: item => item.spec?.scrapeTarget || '',
        render: item => <TextValue value={item.spec?.scrapeTarget} />,
      },
      {
        id: 'stable-window',
        label: 'Stable Window',
        getValue: item => item.spec?.stableWindow ?? '',
        render: item => <TextValue value={formatNanoseconds(item.spec?.stableWindow)} />,
      },
      {
        id: 'panic-window',
        label: 'Panic Window',
        getValue: item => item.spec?.panicWindow ?? '',
        render: item => <TextValue value={formatNanoseconds(item.spec?.panicWindow)} />,
      },
      ...getReadinessColumns<KnativeMetric>(),
      'age',
    ],
    [showClusterColumn]
  );

  if (!isKnativeInstalled) {
    return <NotInstalledBanner isLoading={isKnativeCheckLoading} />;
  }

  return (
    <ResourceListView
      title="Metrics"
      resourceClass={KnativeMetric}
      columns={columns}
      reflectInURL="knative-metrics"
      id="knative-metrics"
      enableRowActions={false}
      enableRowSelection={false}
      headerProps={{ titleSideActions: [] }}
    />
  );
}
