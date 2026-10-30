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
import type { KubeObject, KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Typography } from '@mui/material';
import React from 'react';
import { useClusters } from '../../hooks/useClusters';
import { useKnativeInstalled } from '../../hooks/useKnativeInstalled';
import { useSelectedNamespaces } from '../../hooks/useSelectedNamespaces';
import { CustomResourceDefinition } from '../../resources/k8s/customResourceDefinition';
import { getKnativeCrdName } from '../../resources/knative';
import type { KnativeResourceClass } from '../../resources/knative/customResourceLinks';
import { getCrdKindInfo } from '../../resources/knative/eventingData';
import { NotInstalledBanner } from './NotInstalledBanner';

/** The columns of a list of discovered kinds. */
export type DiscoveredKindsColumns<T extends KubeObject> = (
  | ResourceTableColumn<T>
  | 'name'
  | 'namespace'
  | 'cluster'
  | 'kind'
  | 'age'
)[];

/** One kind found in one cluster. */
type DiscoveredKind<C> = {
  /** Identifies the kind in its cluster: the cluster and the CRD name. */
  key: string;
  /** The cluster the CRD is in. */
  cluster: string;
  /** The class that lists the kind's objects. */
  kindClass: C;
};

/** How to find the kinds of a list and what to show. */
type DiscoveredKindsListProps<T extends KubeObject, C> = {
  /** The list's title. */
  title: string;
  /** Identifies the list's table, and its state in the URL. */
  id: string;
  /** The label that marks the CRDs of the kinds to list. */
  labelSelector: string;
  /** Names of labelled CRDs to leave out. */
  excludedCrds?: string[];
  /** Knative's own kinds, listed where the CRDs cannot be listed. */
  fallbackKinds: KnativeResourceClass[];
  /** Gives the class that lists one kind, the same class each time for the same kind. */
  getKindClass: (info: KnativeResourceClass) => C;
  /** Builds the columns; it must be the same function on every render. */
  columns: (showClusterColumn: boolean) => DiscoveredKindsColumns<T>;
  /** What the kinds are called in the note shown when only Knative's own kinds are listed. */
  kindLabel: string;
};

/**
 * Turns labelled CRDs into the kinds to list, in a stable order. In a cluster whose CRDs cannot be
 * listed, for example because the user may not list CRDs, it lists Knative's own kinds instead.
 *
 * @param crds - The labelled CRDs, each with the cluster it was found in.
 * @param clustersWithoutCrds - The clusters whose CRDs could not be listed.
 * @param options - Knative's own kinds, the CRDs to leave out, and how to get a kind's class.
 * @returns One kind per CRD and cluster, sorted by cluster and CRD name, leaving out CRDs that
 * serve no version.
 */
export function getDiscoveredKinds<C>(
  crds: Pick<CustomResourceDefinition, 'cluster' | 'jsonData'>[],
  clustersWithoutCrds: string[],
  {
    fallbackKinds,
    excludedCrds = [],
    getKindClass,
  }: Pick<
    DiscoveredKindsListProps<KubeObject, C>,
    'fallbackKinds' | 'excludedCrds' | 'getKindClass'
  >
): DiscoveredKind<C>[] {
  const toKind = (cluster: string, info: KnativeResourceClass): DiscoveredKind<C> => ({
    key: `${cluster}/${getKnativeCrdName(info)}`,
    cluster,
    kindClass: getKindClass(info),
  });

  return [
    ...crds.flatMap(crd => {
      if (excludedCrds.includes(crd.jsonData.metadata.name)) return [];
      const info = getCrdKindInfo(crd.jsonData);
      return info ? [toKind(crd.cluster, info)] : [];
    }),
    ...clustersWithoutCrds.flatMap(cluster => fallbackKinds.map(info => toKind(cluster, info))),
  ].sort((a, b) => a.key.localeCompare(b.key));
}

type KindRowsProps<T extends KubeObject, C> = DiscoveredKindsListProps<T, C> & {
  /** The kinds to list. */
  kinds: DiscoveredKind<C>[];
  /** The clusters whose CRDs could not be listed, so only Knative's own kinds are listed. */
  clustersWithoutCrds: string[];
  /** Whether more than one cluster is selected. */
  showClusterColumn: boolean;
};

/**
 * Lists the objects of every kind and shows them in one table, with the errors of every list that
 * failed and a note when only Knative's own kinds are listed in some cluster. It remounts the
 * table whenever the kinds change, because the table calls one list hook per kind.
 *
 * @param props - The kinds to list, the clusters whose CRDs could not be listed, whether to show
 * the cluster column, and what the list shows.
 * @returns The table.
 */
function KindRows<T extends KubeObject, C extends KubeObjectClass & (new (...args: never[]) => T)>(
  props: KindRowsProps<T, C>
) {
  return <KindRowsOfKinds key={JSON.stringify(props.kinds.map(kind => kind.key))} {...props} />;
}

/**
 * The table of `KindRows`. The kinds must not change while it is mounted.
 *
 * @param props - The props of `KindRows`.
 * @returns The table.
 */
function KindRowsOfKinds<
  T extends KubeObject,
  C extends KubeObjectClass & (new (...args: never[]) => T)
>({
  title,
  id,
  columns,
  kindLabel,
  kinds,
  clustersWithoutCrds,
  showClusterColumn,
}: KindRowsProps<T, C>) {
  const namespaces = useSelectedNamespaces();
  const lists = kinds.map(({ cluster, kindClass }) =>
    kindClass.useList({ cluster, namespace: namespaces })
  );
  const tableColumns = React.useMemo(
    () => columns(showClusterColumn),
    [columns, showClusterColumn]
  );

  return (
    <ResourceListView
      title={title}
      id={id}
      headerProps={{ noNamespaceFilter: false }}
      enableRowActions={false}
      enableRowSelection={false}
      data={lists.some(list => list.isLoading) ? null : lists.flatMap(list => list.items ?? [])}
      errors={lists.flatMap(list => list.errors ?? [])}
      columns={tableColumns}
      reflectInURL={id}
    >
      {clustersWithoutCrds.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          The {kindLabel} CustomResourceDefinitions could not be listed
          {showClusterColumn && ` in ${clustersWithoutCrds.join(', ')}`}, so only Knative&apos;s own
          kinds are shown.
        </Typography>
      )}
    </ResourceListView>
  );
}

/**
 * Lists, in the selected clusters, the objects of every kind whose CRD carries a label, such as
 * every kind of Source or of channel implementation, Knative's own and those of other projects,
 * or Knative's own kinds where the CRDs cannot be listed.
 *
 * @param props - How to find the kinds and what the list shows.
 * @returns The list, or a banner when Knative Eventing is not installed.
 */
export function DiscoveredKindsList<
  T extends KubeObject,
  C extends KubeObjectClass & (new (...args: never[]) => T)
>(props: DiscoveredKindsListProps<T, C>) {
  const clusters = useClusters();
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled('eventing', clusters);

  if (!isKnativeInstalled) {
    return <NotInstalledBanner isLoading={isKnativeCheckLoading} component="eventing" />;
  }

  return <DiscoveredKindsTable {...props} clusters={clusters} />;
}

/**
 * Finds the kinds in the selected clusters and lists their objects.
 *
 * @param props - The selected clusters, how to find the kinds and what the list shows.
 * @returns The table.
 */
function DiscoveredKindsTable<
  T extends KubeObject,
  C extends KubeObjectClass & (new (...args: never[]) => T)
>({
  clusters,
  ...props
}: DiscoveredKindsListProps<T, C> & {
  /** The selected clusters. */
  clusters: string[];
}) {
  const {
    items: crds,
    errors,
    isLoading,
  } = CustomResourceDefinition.useList({ clusters, labelSelector: props.labelSelector });

  if (isLoading) {
    return <ResourceListView title={props.title} id={props.id} data={null} columns={['name']} />;
  }

  const clustersWithoutCrds = clusters.filter(
    cluster =>
      !crds?.some(crd => crd.cluster === cluster) &&
      errors?.some(error => !error.cluster || error.cluster === cluster)
  );

  return (
    <KindRows
      {...props}
      kinds={getDiscoveredKinds(crds ?? [], clustersWithoutCrds, props)}
      clustersWithoutCrds={clustersWithoutCrds}
      showClusterColumn={clusters.length > 1}
    />
  );
}
