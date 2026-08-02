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
  Link,
  ResourceListView,
  ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useClusters } from '../../hooks/useClusters';
import { useKnativeInstalled } from '../../hooks/useKnativeInstalled';
import { KnativeConfiguration } from '../../resources/knative';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import { EmptyValue, getReadinessColumns } from '../common/ResourceListCells';

export function ConfigurationsList() {
  const clusters = useClusters();
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled(clusters);
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
        render: item =>
          item.parentService ? (
            <Link
              routeName="kserviceDetails"
              params={{
                namespace: item.metadata.namespace || 'default',
                name: item.parentService,
              }}
              activeCluster={item.cluster}
            >
              {item.parentService}
            </Link>
          ) : (
            <EmptyValue />
          ),
      },
      {
        id: 'latest-created-revision',
        label: 'Latest Created',
        getValue: item => item.status?.latestCreatedRevisionName || '',
        render: item =>
          item.status?.latestCreatedRevisionName ? (
            <Link
              routeName="revisionDetails"
              params={{
                namespace: item.metadata.namespace || 'default',
                name: item.status.latestCreatedRevisionName,
              }}
              activeCluster={item.cluster}
            >
              {item.status.latestCreatedRevisionName}
            </Link>
          ) : (
            <EmptyValue />
          ),
      },
      {
        id: 'latest-ready-revision',
        label: 'Latest Ready',
        getValue: item => item.status?.latestReadyRevisionName || '',
        render: item =>
          item.status?.latestReadyRevisionName ? (
            <Link
              routeName="revisionDetails"
              params={{
                namespace: item.metadata.namespace || 'default',
                name: item.status.latestReadyRevisionName,
              }}
              activeCluster={item.cluster}
            >
              {item.status.latestReadyRevisionName}
            </Link>
          ) : (
            <EmptyValue />
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
