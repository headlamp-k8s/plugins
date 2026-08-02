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

import type { KubeOwnerReference } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import type { Condition } from './common';

type ResourceMetadata = {
  labels?: Record<string, string>;
  ownerReferences?: KubeOwnerReference[];
};

export function findReadyCondition(status?: { conditions?: Condition[] }): Condition | undefined {
  return status?.conditions?.find(condition => condition.type === 'Ready');
}

export function getServingLabel(
  metadata: ResourceMetadata,
  label: 'serving.knative.dev/service' | 'serving.knative.dev/revision'
): string | undefined {
  return metadata.labels?.[label];
}

export function getRevisionName(
  metadata: ResourceMetadata,
  referencedName?: string
): string | undefined {
  return getServingLabel(metadata, 'serving.knative.dev/revision') || referencedName;
}

export function collectIngressHosts(rules?: Array<{ hosts?: string[] }>): string[] {
  return Array.from(new Set(rules?.flatMap(rule => rule.hosts || []) || []));
}

export function getFirstOwner(metadata: ResourceMetadata) {
  return metadata.ownerReferences?.[0];
}
