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
import { KnativeIngress } from '../../resources/knative';
import { formatList } from '../../utils/servingResources';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import { OwnerLink } from '../common/OwnerLink';
import { getReadinessColumns, TextValue } from '../common/ResourceListCells';

export function IngressesList() {
  const clusters = useClusters();
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled('serving', clusters);
  const showClusterColumn = clusters.length > 1;
  const columns = React.useMemo<
    (ResourceTableColumn<KnativeIngress> | 'name' | 'namespace' | 'cluster' | 'age')[]
  >(
    () => [
      'name',
      'namespace',
      ...(showClusterColumn ? (['cluster'] as const) : []),
      {
        id: 'owner',
        label: 'Owner',
        getValue: item => item.owner?.name || '',
        render: item => (
          <OwnerLink
            owner={item.owner}
            namespace={item.metadata.namespace}
            cluster={item.cluster}
          />
        ),
      },
      {
        id: 'hosts',
        label: 'Hosts',
        getValue: item => formatList(item.hosts),
        render: item => <TextValue value={formatList(item.hosts)} />,
      },
      ...getReadinessColumns<KnativeIngress>(),
      'age',
    ],
    [showClusterColumn]
  );

  if (!isKnativeInstalled) {
    return <NotInstalledBanner isLoading={isKnativeCheckLoading} />;
  }

  return (
    <ResourceListView
      title="KIngresses"
      resourceClass={KnativeIngress}
      columns={columns}
      reflectInURL="knative-ingresses"
      id="knative-ingresses"
      enableRowActions={false}
      enableRowSelection={false}
      headerProps={{ titleSideActions: [] }}
    />
  );
}
