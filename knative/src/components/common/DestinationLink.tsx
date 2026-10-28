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

import type { ResourceTableColumn } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import type { Destination } from '../../resources/knative/common';
import { formatDestination } from '../../resources/knative/eventingData';
import { OwnerLink } from './OwnerLink';
import { TextValue } from './ResourceListCells';

/**
 * Shows where a Knative resource sends events, such as a Trigger's or Subscription's subscriber.
 *
 * @param props - The destination, and the namespace and cluster of the resource that names it.
 * @returns A link to the referenced object, its name or URI as text when it cannot be linked, or
 * an empty value when there is no destination.
 */
export function DestinationLink({
  destination,
  namespace,
  cluster,
}: {
  /** The destination to show. */
  destination?: Destination;
  /** Namespace of the resource that names the destination; a reference without one uses it. */
  namespace?: string;
  /** Cluster of the resource that names the destination. */
  cluster?: string;
}) {
  const label = formatDestination(destination);
  const ref = destination?.ref;
  if (!ref?.apiVersion || !ref.kind || !ref.name) return <TextValue value={label} />;

  return (
    <OwnerLink
      owner={{ apiVersion: ref.apiVersion, kind: ref.kind, name: ref.name }}
      namespace={ref.namespace || namespace}
      cluster={cluster}
      label={label}
    />
  );
}

/**
 * Builds a list column that shows a destination a resource names, such as a Subscription's
 * subscriber.
 *
 * @param id - The column's id.
 * @param label - The column's heading.
 * @param getDestination - Reads the destination from a row's resource.
 * @returns A column that sorts and filters by the destination's text and links to it.
 */
export function destinationColumn<T extends KubeObject>(
  id: string,
  label: string,
  getDestination: (item: T) => Destination | undefined
): ResourceTableColumn<T> {
  return {
    id,
    label,
    getValue: item => formatDestination(getDestination(item)),
    render: item => (
      <DestinationLink
        destination={getDestination(item)}
        namespace={item.metadata.namespace}
        cluster={item.cluster}
      />
    ),
  };
}
