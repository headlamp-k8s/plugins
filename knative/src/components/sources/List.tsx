/*
 * Copyright 2026 The Kubernetes Authors
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
  type ResourceTableColumn,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Typography } from '@mui/material';
import React from 'react';
import { useClusters } from '../../hooks/useClusters';
import { useKnativeInstalled } from '../../hooks/useKnativeInstalled';
import { useSelectedNamespaces } from '../../hooks/useSelectedNamespaces';
import { CustomResourceDefinition } from '../../resources/k8s/customResourceDefinition';
import {
  getKnativeCrdName,
  getKnativeSourceClass,
  KnativeSource,
  SOURCE_CRD_LABEL_SELECTOR,
} from '../../resources/knative';
import {
  formatDestination,
  getSourceKindInfo,
  KNATIVE_SOURCE_KINDS,
} from '../../resources/knative/eventingData';
import { DestinationLink } from '../common/DestinationLink';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import { getReadinessColumns } from '../common/ResourceListCells';

const listViewProps = {
  title: 'Sources',
  id: 'knative-sources',
  headerProps: { noNamespaceFilter: false },
};

/** One kind of Source in one cluster. */
type SourceKind = {
  /** Identifies the kind in its cluster: the cluster and the CRD name. */
  key: string;
  /** The cluster the Source CRD is in. */
  cluster: string;
  /** The class that lists Sources of this kind. */
  sourceClass: typeof KnativeSource;
};

/**
 * Turns Source CRDs into the kinds to list, in a stable order. In a cluster whose CRDs cannot be
 * listed, for example because the user may not list CRDs, it lists Knative's own kinds instead.
 *
 * @param crds - The Source CRDs, each with the cluster it was found in.
 * @param clustersWithoutCrds - The clusters whose Source CRDs could not be listed.
 * @returns One kind per CRD and cluster, sorted by cluster and CRD name, leaving out CRDs that
 * serve no version.
 */
export function getSourceKinds(
  crds: Pick<CustomResourceDefinition, 'cluster' | 'jsonData'>[],
  clustersWithoutCrds: string[]
): SourceKind[] {
  return [
    ...crds.flatMap(crd => {
      const info = getSourceKindInfo(crd.jsonData);
      return info ? [{ cluster: crd.cluster, info }] : [];
    }),
    ...clustersWithoutCrds.flatMap(cluster =>
      KNATIVE_SOURCE_KINDS.map(info => ({ cluster, info }))
    ),
  ]
    .map(({ cluster, info }) => ({
      key: `${cluster}/${getKnativeCrdName(info)}`,
      cluster,
      sourceClass: getKnativeSourceClass(info),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Lists the Sources of every kind and shows them in one table. It calls one list hook per kind,
 * so the kinds must not change while it is mounted: its parent gives it a key made from them.
 *
 * @param props - The kinds to list, the clusters whose Source CRDs could not be listed, and
 * whether to show the cluster column.
 * @returns The table, with the errors of every list that failed, and a note when only Knative's
 * own kinds are listed in some cluster.
 */
function SourceRows({
  sourceKinds,
  clustersWithoutCrds,
  showClusterColumn,
}: {
  /** The kinds to list. */
  sourceKinds: SourceKind[];
  /** The clusters whose Source CRDs could not be listed, so only Knative's own kinds are listed. */
  clustersWithoutCrds: string[];
  /** Whether more than one cluster is selected. */
  showClusterColumn: boolean;
}) {
  const namespaces = useSelectedNamespaces();
  const lists = sourceKinds.map(({ cluster, sourceClass }) =>
    sourceClass.useList({ cluster, namespace: namespaces })
  );

  const columns = React.useMemo<
    (ResourceTableColumn<KnativeSource> | 'name' | 'namespace' | 'cluster' | 'kind' | 'age')[]
  >(
    () => [
      'name',
      'namespace',
      ...(showClusterColumn ? (['cluster'] as const) : []),
      'kind',
      {
        id: 'sink',
        label: 'Sink',
        getValue: item => formatDestination(item.sink),
        render: item => (
          <DestinationLink
            destination={item.sink}
            namespace={item.metadata.namespace}
            cluster={item.cluster}
          />
        ),
      },
      ...getReadinessColumns<KnativeSource>(),
      'age',
    ],
    [showClusterColumn]
  );

  const errors = lists.flatMap(list => list.errors ?? []);

  return (
    <ResourceListView
      {...listViewProps}
      data={lists.some(list => list.isLoading) ? null : lists.flatMap(list => list.items ?? [])}
      errors={errors.length > 0 ? errors : null}
      columns={columns}
      reflectInURL="knative-sources"
    >
      {clustersWithoutCrds.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          The Source CustomResourceDefinitions could not be listed
          {showClusterColumn && ` in ${clustersWithoutCrds.join(', ')}`}, so only Knative&apos;s own
          kinds of Source are shown.
        </Typography>
      )}
    </ResourceListView>
  );
}

/**
 * Finds the Source kinds in the selected clusters and lists their Sources.
 *
 * @param props - The selected clusters.
 * @returns The Sources table.
 */
function SourcesTable({
  clusters,
}: {
  /** The selected clusters. */
  clusters: string[];
}) {
  const {
    items: crds,
    errors,
    isLoading,
  } = CustomResourceDefinition.useList({
    clusters,
    labelSelector: SOURCE_CRD_LABEL_SELECTOR,
  });

  if (isLoading) {
    return <ResourceListView {...listViewProps} data={null} columns={['name']} />;
  }

  const clustersWithoutCrds = clusters.filter(
    cluster =>
      !crds?.some(crd => crd.cluster === cluster) &&
      !!errors?.some(error => !error.cluster || error.cluster === cluster)
  );
  const sourceKinds = getSourceKinds(crds ?? [], clustersWithoutCrds);

  return (
    <SourceRows
      key={JSON.stringify(sourceKinds.map(kind => kind.key))}
      sourceKinds={sourceKinds}
      clustersWithoutCrds={clustersWithoutCrds}
      showClusterColumn={clusters.length > 1}
    />
  );
}

/**
 * Lists the Knative Sources of every kind in the selected clusters: the kinds labelled
 * `duck.knative.dev/source=true`, Knative's own and those of other projects, or Knative's own
 * kinds where the CRDs cannot be listed.
 *
 * @returns The Sources list, or a banner when Knative Eventing is not installed.
 */
export function SourcesList() {
  const clusters = useClusters();
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled('eventing', clusters);

  if (!isKnativeInstalled) {
    return <NotInstalledBanner isLoading={isKnativeCheckLoading} component="eventing" />;
  }

  return <SourcesTable clusters={clusters} />;
}
