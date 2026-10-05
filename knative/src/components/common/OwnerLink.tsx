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
  KnativeCertificate,
  KnativeConfiguration,
  KnativeImage,
  KnativeIngress,
  KnativeMetric,
  KnativePodAutoscaler,
  KnativeRoute,
  KnativeServerlessService,
} from '../../resources/knative';
import { EmptyValue, TextValue } from './ResourceListCells';

const ownerResourceClasses = [
  KnativeConfiguration,
  KnativeRoute,
  KnativePodAutoscaler,
  KnativeMetric,
  KnativeImage,
  KnativeIngress,
  KnativeServerlessService,
  KnativeCertificate,
];

const ownerCrdNames = new Map(
  ownerResourceClasses.flatMap(resourceClass =>
    (Array.isArray(resourceClass.apiVersion)
      ? resourceClass.apiVersion
      : [resourceClass.apiVersion]
    ).map(
      apiVersion =>
        [`${apiVersion}/${resourceClass.kind}`, getKnativeCrdName(resourceClass)] as const
    )
  )
);

const ownerRouteNames = new Map<string, string>([
  ['serving.knative.dev/v1/Service', 'kserviceDetails'],
  ['serving.knative.dev/v1/Revision', 'revisionDetails'],
  ['v1/Service', 'service'],
  ['v1/Secret', 'secret'],
]);

function getOwnerCrdName(owner: KubeOwnerReference): string | undefined {
  return ownerCrdNames.get(`${owner.apiVersion}/${owner.kind}`);
}

export function OwnerLink({
  owner,
  namespace,
  cluster,
}: {
  owner?: KubeOwnerReference;
  namespace?: string;
  cluster?: string;
}) {
  if (!owner) return <EmptyValue />;

  const routeName = ownerRouteNames.get(`${owner.apiVersion}/${owner.kind}`);
  if (routeName) {
    return (
      <Link
        routeName={routeName}
        params={{ namespace: namespace || 'default', name: owner.name }}
        activeCluster={cluster}
      >
        {owner.name}
      </Link>
    );
  }

  const crd = getOwnerCrdName(owner);
  if (!crd) return <TextValue value={owner.name} />;

  return (
    <Link
      routeName="customresource"
      params={{ crd, namespace: namespace || 'default', crName: owner.name }}
      activeCluster={cluster}
    >
      {owner.name}
    </Link>
  );
}
