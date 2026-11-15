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

import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import type { ManagedResource } from '../../resources/application';

type ResourceClass = new (jsonData: K8s.cluster.KubeObjectInterface) => K8s.cluster.KubeObject;

/**
 * Returns a Headlamp resource link when the managed resource has a built-in detail view.
 */
export function getManagedResourceLink(resource: ManagedResource) {
  if (!resource.namespace) {
    return resource.name;
  }

  const ResourceType = K8s.ResourceClasses[resource.kind as keyof typeof K8s.ResourceClasses] as
    | ResourceClass
    | undefined;
  if (!ResourceType) {
    return resource.name;
  }

  const kubeObject = new ResourceType({
    apiVersion: resource.group ? `${resource.group}/${resource.version}` : resource.version,
    kind: resource.kind,
    metadata: { name: resource.name, namespace: resource.namespace },
  } as K8s.cluster.KubeObjectInterface);

  if (!kubeObject.getDetailsLink()) {
    return resource.name;
  }

  return <Link kubeObject={kubeObject}>{resource.name}</Link>;
}
