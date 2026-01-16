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

const KNATIVE_SERVING_KSERVICE_CRD_NAME = 'services.serving.knative.dev';

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

export async function isKnativeInstalled(clusters: string[]): Promise<boolean> {
  if (!clusters || clusters.length === 0) {
    return false;
  }

  const results = await Promise.all(
    clusters.map(cluster => hasCrdInCluster(cluster, KNATIVE_SERVING_KSERVICE_CRD_NAME))
  );

  // Consider Knative "installed" only if it exists in all selected clusters.
  return results.every(Boolean);
}
