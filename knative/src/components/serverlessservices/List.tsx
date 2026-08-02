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
import { KnativeServerlessService } from '../../resources/knative';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import { EmptyValue, getReadinessColumns, TextValue } from '../common/ResourceListCells';

export function ServerlessServicesList() {
  const clusters = useClusters();
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled(clusters);
  const showClusterColumn = clusters.length > 1;
  const columns = React.useMemo<
    (ResourceTableColumn<KnativeServerlessService> | 'name' | 'namespace' | 'cluster' | 'age')[]
  >(
    () => [
      'name',
      'namespace',
      ...(showClusterColumn ? (['cluster'] as const) : []),
      {
        id: 'revision',
        label: 'Revision',
        getValue: item => item.revisionName || '',
        render: item =>
          item.revisionName ? (
            <Link
              routeName="revisionDetails"
              params={{
                namespace: item.metadata.namespace || 'default',
                name: item.revisionName,
              }}
              activeCluster={item.cluster}
            >
              {item.revisionName}
            </Link>
          ) : (
            <EmptyValue />
          ),
      },
      {
        id: 'mode',
        label: 'Mode',
        getValue: item => item.spec?.mode || '',
        render: item => <TextValue value={item.spec?.mode} />,
      },
      {
        id: 'activators',
        label: 'Activators',
        getValue: item => item.spec?.numActivators ?? '',
        render: item => <TextValue value={item.spec?.numActivators} />,
      },
      {
        id: 'public-service',
        label: 'Public Service',
        getValue: item => item.status?.serviceName || '',
        render: item =>
          item.status?.serviceName ? (
            <Link
              routeName="service"
              params={{
                namespace: item.metadata.namespace || 'default',
                name: item.status.serviceName,
              }}
              activeCluster={item.cluster}
            >
              {item.status.serviceName}
            </Link>
          ) : (
            <EmptyValue />
          ),
      },
      {
        id: 'private-service',
        label: 'Private Service',
        getValue: item => item.status?.privateServiceName || '',
        render: item =>
          item.status?.privateServiceName ? (
            <Link
              routeName="service"
              params={{
                namespace: item.metadata.namespace || 'default',
                name: item.status.privateServiceName,
              }}
              activeCluster={item.cluster}
            >
              {item.status.privateServiceName}
            </Link>
          ) : (
            <EmptyValue />
          ),
      },
      ...getReadinessColumns<KnativeServerlessService>(),
      'age',
    ],
    [showClusterColumn]
  );

  if (!isKnativeInstalled) {
    return <NotInstalledBanner isLoading={isKnativeCheckLoading} />;
  }

  return (
    <ResourceListView
      title="Serverless Services"
      resourceClass={KnativeServerlessService}
      columns={columns}
      reflectInURL="knative-serverless-services"
      id="knative-serverless-services"
      enableRowActions={false}
      enableRowSelection={false}
      headerProps={{ titleSideActions: [] }}
    />
  );
}
