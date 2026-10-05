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
import { KnativePodAutoscaler } from '../../resources/knative';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import {
  getReadinessColumns,
  NamespacedResourceLink,
  TextValue,
} from '../common/ResourceListCells';

export function PodAutoscalersList() {
  const clusters = useClusters();
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled(clusters);
  const showClusterColumn = clusters.length > 1;
  const columns = React.useMemo<
    (ResourceTableColumn<KnativePodAutoscaler> | 'name' | 'namespace' | 'cluster' | 'age')[]
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
        id: 'desired-scale',
        label: 'Desired Scale',
        getValue: item => item.status?.desiredScale ?? '',
        render: item => <TextValue value={item.status?.desiredScale} />,
      },
      {
        id: 'actual-scale',
        label: 'Actual Scale',
        getValue: item => item.status?.actualScale ?? '',
        render: item => <TextValue value={item.status?.actualScale} />,
      },
      ...getReadinessColumns<KnativePodAutoscaler>(),
      'age',
    ],
    [showClusterColumn]
  );

  if (!isKnativeInstalled) {
    return <NotInstalledBanner isLoading={isKnativeCheckLoading} />;
  }

  return (
    <ResourceListView
      title="Pod Autoscalers"
      resourceClass={KnativePodAutoscaler}
      columns={columns}
      reflectInURL="knative-pod-autoscalers"
      id="knative-pod-autoscalers"
      enableRowActions={false}
      enableRowSelection={false}
      headerProps={{ titleSideActions: [] }}
    />
  );
}
