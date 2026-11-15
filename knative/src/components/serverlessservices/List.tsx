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
import { KnativeServerlessService } from '../../resources/knative';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import {
  getReadinessColumns,
  NamespacedResourceLink,
  TextValue,
} from '../common/ResourceListCells';

export function ServerlessServicesList() {
  const clusters = useClusters();
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled('serving', clusters);
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
        render: item => (
          <NamespacedResourceLink
            routeName="service"
            name={item.status?.serviceName}
            namespace={item.metadata.namespace}
            cluster={item.cluster}
          />
        ),
      },
      {
        id: 'private-service',
        label: 'Private Service',
        getValue: item => item.status?.privateServiceName || '',
        render: item => (
          <NamespacedResourceLink
            routeName="service"
            name={item.status?.privateServiceName}
            namespace={item.metadata.namespace}
            cluster={item.cluster}
          />
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
