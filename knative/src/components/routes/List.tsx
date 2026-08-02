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
import { Typography } from '@mui/material';
import React from 'react';
import { useClusters } from '../../hooks/useClusters';
import { useKnativeInstalled } from '../../hooks/useKnativeInstalled';
import { KnativeRoute } from '../../resources/knative';
import { formatTraffic } from '../../utils/servingResources';
import { getSafeUrl } from '../../utils/url';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import { EmptyValue, getReadinessColumns, TextValue } from '../common/ResourceListCells';

export function RoutesList() {
  const clusters = useClusters();
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled(clusters);
  const showClusterColumn = clusters.length > 1;
  const columns = React.useMemo<
    (ResourceTableColumn<KnativeRoute> | 'name' | 'namespace' | 'cluster' | 'age')[]
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
        id: 'url',
        label: 'URL',
        getValue: item => item.url || '',
        render: item => {
          const url = getSafeUrl(item.url);
          return url ? (
            <Typography
              component="a"
              variant="body2"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              noWrap
            >
              {url}
            </Typography>
          ) : (
            <EmptyValue />
          );
        },
      },
      {
        id: 'traffic',
        label: 'Traffic',
        getValue: item => formatTraffic(item.traffic),
        render: item => <TextValue value={formatTraffic(item.traffic)} />,
      },
      ...getReadinessColumns<KnativeRoute>(),
      'age',
    ],
    [showClusterColumn]
  );

  if (!isKnativeInstalled) {
    return <NotInstalledBanner isLoading={isKnativeCheckLoading} />;
  }

  return (
    <ResourceListView
      title="Routes"
      resourceClass={KnativeRoute}
      columns={columns}
      reflectInURL="knative-routes"
      id="knative-routes"
      enableRowActions={false}
      enableRowSelection={false}
      headerProps={{ titleSideActions: [] }}
    />
  );
}
