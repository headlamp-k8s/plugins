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
import { Chip, Typography } from '@mui/material';
import React from 'react';
import { useClusters } from '../../hooks/useClusters';
import { useKnativeInstalled } from '../../hooks/useKnativeInstalled';
import { KRevision } from '../../resources/knative';
import { NotInstalledBanner } from '../common/NotInstalledBanner';

export function RevisionsList() {
  const clusters = useClusters();
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled(clusters);
  const showClusterColumn = clusters.length > 1;

  const columns = React.useMemo<
    (ResourceTableColumn<KRevision> | 'namespace' | 'cluster' | 'age')[]
  >(() => {
    const cols: (ResourceTableColumn<KRevision> | 'namespace' | 'cluster' | 'age')[] = [
      {
        id: 'name',
        label: 'Name',
        gridTemplate: 'auto',
        getValue: rev => rev.metadata.name ?? '',
        render: rev => (
          <Link
            routeName="revisionDetails"
            params={{ namespace: rev.metadata.namespace, name: rev.metadata.name }}
            activeCluster={rev.cluster}
          >
            {rev.metadata.name}
          </Link>
        ),
      },
      'namespace',
    ];

    if (showClusterColumn) cols.push('cluster');

    cols.push(
      {
        id: 'service',
        label: 'Service',
        gridTemplate: 'auto',
        getValue: rev => rev.parentService ?? '',
        render: rev =>
          rev.parentService ? (
            <Link
              routeName="kserviceDetails"
              params={{ namespace: rev.metadata.namespace, name: rev.parentService }}
              activeCluster={rev.cluster}
            >
              {rev.parentService}
            </Link>
          ) : (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          ),
      },
      {
        id: 'ready',
        label: 'Ready',
        gridTemplate: 'auto',
        getValue: rev => rev.readyCondition?.status || 'Unknown',
        render: rev => {
          const status = rev.readyCondition?.status || 'Unknown';
          let color: 'success' | 'warning' | 'error' | 'default' = 'default';
          if (status === 'True') color = 'success';
          else if (status === 'False') color = 'error';

          return <Chip label={status} color={color} size="small" variant="outlined" />;
        },
      },
      {
        id: 'image',
        label: 'Image',
        gridTemplate: 'auto',
        getValue: rev => rev.primaryImage ?? '',
        render: rev => (
          <Typography variant="body2" color="text.secondary" noWrap title={rev.primaryImage}>
            {rev.primaryImage?.split('@')[0] || '-'}
          </Typography>
        ),
      },
      'age'
    );
    return cols;
  }, [showClusterColumn]);

  if (!isKnativeInstalled) {
    return <NotInstalledBanner isLoading={isKnativeCheckLoading} />;
  }

  return (
    <ResourceListView
      title="Revisions"
      resourceClass={KRevision}
      columns={columns}
      reflectInURL="knative-revisions"
      id="knative-revisions"
      enableRowActions={false}
      enableRowSelection={false}
      headerProps={{
        titleSideActions: [],
      }}
    />
  );
}
