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
import { KnativeConfiguration } from '../../resources/knative';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import { getReadinessColumns, NamespacedResourceLink } from '../common/ResourceListCells';

export function ConfigurationsList() {
  const clusters = useClusters();
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled('serving', clusters);
  const showClusterColumn = clusters.length > 1;
  const columns = React.useMemo<
    (ResourceTableColumn<KnativeConfiguration> | 'name' | 'namespace' | 'cluster' | 'age')[]
  >(
    () => [
      'name',
      'namespace',
      ...(showClusterColumn ? (['cluster'] as const) : []),
      {
        id: 'service',
        label: 'Service',
        getValue: item => item.parentService || '',
        render: item => (
          <NamespacedResourceLink
            routeName="kserviceDetails"
            name={item.parentService}
            namespace={item.metadata.namespace}
            cluster={item.cluster}
          />
        ),
      },
      {
        id: 'latest-created-revision',
        label: 'Latest Created',
        getValue: item => item.status?.latestCreatedRevisionName || '',
        render: item => (
          <NamespacedResourceLink
            routeName="revisionDetails"
            name={item.status?.latestCreatedRevisionName}
            namespace={item.metadata.namespace}
            cluster={item.cluster}
          />
        ),
      },
      {
        id: 'latest-ready-revision',
        label: 'Latest Ready',
        getValue: item => item.status?.latestReadyRevisionName || '',
        render: item => (
          <NamespacedResourceLink
            routeName="revisionDetails"
            name={item.status?.latestReadyRevisionName}
            namespace={item.metadata.namespace}
            cluster={item.cluster}
          />
        ),
      },
      ...getReadinessColumns<KnativeConfiguration>(),
      'age',
    ],
    [showClusterColumn]
  );

  if (!isKnativeInstalled) {
    return <NotInstalledBanner isLoading={isKnativeCheckLoading} />;
  }

  return (
    <ResourceListView
      title="Configurations"
      resourceClass={KnativeConfiguration}
      columns={columns}
      reflectInURL="knative-configurations"
      id="knative-configurations"
      enableRowActions={false}
      enableRowSelection={false}
      headerProps={{ titleSideActions: [] }}
    />
  );
}
