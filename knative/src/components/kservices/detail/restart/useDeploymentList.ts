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

import Deployment, { type KubeDeployment } from '@kinvolk/headlamp-plugin/lib/k8s/deployment';

/**
 * Lists and watches the Deployments that match a label selector. Headlamp provides
 * `@kinvolk/headlamp-plugin/lib/k8s/deployment` only at run time, so this is the one place that
 * imports it for the restart, and tests replace this module.
 *
 * @param cluster - Cluster to list from.
 * @param namespace - Namespace to list from.
 * @param labelSelector - Label selector of the Deployments to list.
 * @returns Headlamp's list result: the Deployments, and whether they are loaded, fresh or failed.
 */
export function useDeploymentList(cluster: string, namespace: string, labelSelector: string) {
  return Deployment.useList({ cluster, namespace, labelSelector });
}

/**
 * Builds Headlamp's Deployment objects from plain Deployments, so that the restart can patch them.
 *
 * @param items - The Deployments as the API server returned them.
 * @param cluster - Cluster the Deployments are in.
 * @returns The Deployments as Headlamp objects of that cluster.
 */
export function toDeployments(items: readonly KubeDeployment[], cluster: string): Deployment[] {
  return items.map(item => new Deployment(item, cluster));
}
