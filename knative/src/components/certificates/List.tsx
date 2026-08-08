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
  DateLabel,
  ResourceListView,
  ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { useClusters } from '../../hooks/useClusters';
import { useKnativeInstalled } from '../../hooks/useKnativeInstalled';
import { KnativeCertificate } from '../../resources/knative';
import { formatList } from '../../utils/servingResources';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import { OwnerLink } from '../common/OwnerLink';
import {
  EmptyValue,
  getReadinessColumns,
  NamespacedResourceLink,
  TextValue,
} from '../common/ResourceListCells';

export function CertificatesList() {
  const clusters = useClusters();
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled(clusters);
  const showClusterColumn = clusters.length > 1;
  const columns = React.useMemo<
    (ResourceTableColumn<KnativeCertificate> | 'name' | 'namespace' | 'cluster' | 'age')[]
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
        id: 'dns-names',
        label: 'DNS Names',
        getValue: item => formatList(item.spec?.dnsNames),
        render: item => <TextValue value={formatList(item.spec?.dnsNames)} />,
      },
      {
        id: 'secret',
        label: 'Secret',
        getValue: item => item.spec?.secretName || '',
        render: item => (
          <NamespacedResourceLink
            routeName="secret"
            name={item.spec?.secretName}
            namespace={item.metadata.namespace}
            cluster={item.cluster}
          />
        ),
      },
      {
        id: 'expiry',
        label: 'Expiry',
        getValue: item => item.status?.notAfter || '',
        render: item =>
          item.status?.notAfter ? (
            <DateLabel date={item.status.notAfter} format="mini" />
          ) : (
            <EmptyValue />
          ),
      },
      ...getReadinessColumns<KnativeCertificate>(),
      'age',
    ],
    [showClusterColumn]
  );

  if (!isKnativeInstalled) {
    return <NotInstalledBanner isLoading={isKnativeCheckLoading} />;
  }

  return (
    <ResourceListView
      title="Certificates"
      resourceClass={KnativeCertificate}
      columns={columns}
      reflectInURL="knative-certificates"
      id="knative-certificates"
      enableRowActions={false}
      enableRowSelection={false}
      headerProps={{ titleSideActions: [] }}
    />
  );
}
