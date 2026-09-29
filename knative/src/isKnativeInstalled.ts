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

import { CustomResourceDefinition } from './resources/k8s/customResourceDefinition';

/**
 * Knative components install independently of each other, so a cluster may
 * serve Serving, Eventing, both, or neither. Anything that depends on Knative
 * being present has to say which component it needs.
 */
export type KnativeComponent = 'serving' | 'eventing';

/**
 * A CRD that is present whenever the component is installed, used to detect it.
 *
 * Serving is detected through Service because it is the resource the plugin is
 * built around. Eventing is detected through Broker for the same reason: it is
 * part of the core Eventing install rather than an optional add-on.
 */
const COMPONENT_CRD_NAME: Record<KnativeComponent, string> = {
  serving: 'services.serving.knative.dev',
  eventing: 'brokers.eventing.knative.dev',
};

function hasCrdInCluster(cluster: string, crdName: string): Promise<boolean> {
  return new Promise(resolve => {
    let cancelFn: (() => void) | null = null;
    let settled = false;

    function settle(result: boolean) {
      if (settled) {
        return;
      }
      settled = true;
      resolve(result);
      if (cancelFn) {
        cancelFn();
      }
    }

    const request = CustomResourceDefinition.apiGet(
      () => settle(true),
      crdName,
      undefined,
      () => settle(false),
      { cluster }
    );

    request()
      .then(cancel => {
        cancelFn = cancel;
      })
      .catch(() => {
        settle(false);
      });
  });
}

/**
 * Checks whether a single Knative component is installed.
 *
 * @param component The Knative component to look for.
 * @param clusters The clusters to check.
 * @returns True when the component is present in every given cluster.
 */
export async function isKnativeComponentInstalled(
  component: KnativeComponent,
  clusters: string[]
): Promise<boolean> {
  if (!clusters || clusters.length === 0) {
    return false;
  }

  const crdName = COMPONENT_CRD_NAME[component];

  const results = await Promise.all(clusters.map(cluster => hasCrdInCluster(cluster, crdName)));

  // Consider the component "installed" only if it exists in all selected clusters.
  return results.every(Boolean);
}
