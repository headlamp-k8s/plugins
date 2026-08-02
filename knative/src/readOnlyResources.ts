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

import { DetailsViewDefaultHeaderActions } from '@kinvolk/headlamp-plugin/lib';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

// Only controller-owned generated resources are read-only. The controller may be another
// Knative internal resource or a core resource such as Namespace. Service, Revision,
// DomainMapping, and ClusterDomainClaim retain their user-facing workflow actions.
const READ_ONLY_KNATIVE_GVKS = new Set([
  'serving.knative.dev/v1/Configuration',
  'serving.knative.dev/v1/Route',
  'autoscaling.internal.knative.dev/v1alpha1/PodAutoscaler',
  'autoscaling.internal.knative.dev/v1alpha1/Metric',
  'caching.internal.knative.dev/v1alpha1/Image',
  'networking.internal.knative.dev/v1alpha1/Ingress',
  'networking.internal.knative.dev/v1alpha1/ServerlessService',
  'networking.internal.knative.dev/v1alpha1/Certificate',
]);

function isReadOnlyKnativeResource(resource: KubeObject | null): boolean {
  if (!resource) return false;

  const apiVersion = resource.jsonData.apiVersion;
  const kind = resource.jsonData.kind;
  const isReadOnlyKind = Boolean(
    apiVersion && kind && READ_ONLY_KNATIVE_GVKS.has(`${apiVersion}/${kind}`)
  );
  const hasControllerOwner = resource.jsonData.metadata?.ownerReferences?.some(
    owner => owner.controller
  );

  return isReadOnlyKind && Boolean(hasControllerOwner);
}

export function filterReadOnlyKnativeHeaderActions<T extends { id: string }>(
  resource: KubeObject | null,
  actions: T[]
): T[] {
  if (!isReadOnlyKnativeResource(resource)) return actions;

  const mutatingDefaultActions = new Set<string>([
    DetailsViewDefaultHeaderActions.EDIT,
    DetailsViewDefaultHeaderActions.DELETE,
    DetailsViewDefaultHeaderActions.SCALE,
    DetailsViewDefaultHeaderActions.RESTART,
  ]);
  return actions.filter(action => !mutatingDefaultActions.has(action.id));
}
