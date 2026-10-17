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

import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import type { KubeOwnerReference } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import {
  getKnativeCrdName,
  KnativeBroker,
  KnativeCertificate,
  KnativeChannel,
  KnativeConfiguration,
  KnativeImage,
  KnativeIngress,
  KnativeMetric,
  KnativePodAutoscaler,
  KnativeRoute,
  KnativeServerlessService,
  KnativeSubscription,
  KnativeTrigger,
} from '../../resources/knative';
import { EmptyValue, TextValue } from './ResourceListCells';

const ownerResourceClasses = [
  KnativeBroker,
  KnativeConfiguration,
  KnativeRoute,
  KnativePodAutoscaler,
  KnativeMetric,
  KnativeImage,
  KnativeIngress,
  KnativeServerlessService,
  KnativeCertificate,
  KnativeChannel,
  KnativeSubscription,
  KnativeTrigger,
];

const ownerClassesByGvk = ownerResourceClasses.flatMap(resourceClass =>
  (Array.isArray(resourceClass.apiVersion)
    ? resourceClass.apiVersion
    : [resourceClass.apiVersion]
  ).map(apiVersion => [`${apiVersion}/${resourceClass.kind}`, resourceClass] as const)
);

const ownerCrdNames = new Map(
  ownerClassesByGvk.map(([gvk, resourceClass]) => [gvk, getKnativeCrdName(resourceClass)] as const)
);

const ownerRouteNames = new Map<string, string>([
  ['serving.knative.dev/v1/Service', 'kserviceDetails'],
  ['serving.knative.dev/v1/Revision', 'revisionDetails'],
  ...ownerClassesByGvk
    .filter(([, resourceClass]) => resourceClass.detailsRoute !== resourceClass.kind)
    .map(([gvk, resourceClass]) => [gvk, resourceClass.detailsRoute] as const),
  ['v1/Service', 'Service'],
  ['v1/Secret', 'Secret'],
  ['v1/ConfigMap', 'ConfigMap'],
]);

/** The parts of an object reference needed to link to the object. */
type ResourceReference = Pick<KubeOwnerReference, 'apiVersion' | 'kind' | 'name'>;

/**
 * Finds the CRD name of a Knative kind that the plugin links to Headlamp's Custom Resource view.
 *
 * @param owner - The referenced object.
 * @returns The CRD name, for example `routes.serving.knative.dev`, or undefined for other kinds.
 */
function getOwnerCrdName(owner: ResourceReference): string | undefined {
  return ownerCrdNames.get(`${owner.apiVersion}/${owner.kind}`);
}

/**
 * Links to a referenced object: the plugin's pages for Knative Services and Revisions and for the
 * Knative kinds whose class names its own detail route, Headlamp's pages for Services, Secrets and
 * ConfigMaps, and Headlamp's Custom Resource view for the other Knative kinds the plugin knows.
 *
 * @param props - The object to link to, where it is, and the text to show.
 * @returns A link to the object, its name or label as text when it cannot be linked, or an empty
 * value when there is no object.
 */
export function OwnerLink({
  owner,
  namespace,
  cluster,
  label,
}: {
  /** The object to link to. */
  owner?: ResourceReference;
  /** Namespace of the object; `default` when it is not set. */
  namespace?: string;
  /** Cluster of the object. */
  cluster?: string;
  /** Text to show instead of the object's name. */
  label?: string;
}) {
  if (!owner) return <EmptyValue />;

  const text = label || owner.name;

  const routeName = ownerRouteNames.get(`${owner.apiVersion}/${owner.kind}`);
  if (routeName) {
    return (
      <Link
        routeName={routeName}
        params={{ namespace: namespace || 'default', name: owner.name }}
        activeCluster={cluster}
      >
        {text}
      </Link>
    );
  }

  const crd = getOwnerCrdName(owner);
  if (!crd) return <TextValue value={text} />;

  return (
    <Link
      routeName="customresource"
      params={{ crd, namespace: namespace || 'default', crName: owner.name }}
      activeCluster={cluster}
    >
      {text}
    </Link>
  );
}
