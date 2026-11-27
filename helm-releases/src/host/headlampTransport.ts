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

import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { HelmTransport, ListSecretsRequest } from '../helm/releaseStore';

const READ_TIMEOUT_MS = 60_000;

/**
 * Reads Secrets through Headlamp's proxy, hence with the session of the logged-in user, on the
 * cluster given by the caller. The plugin only ever issues GET requests.
 */
export const headlampTransport: HelmTransport = {
  listSecrets({ cluster, namespace, labelSelector, limit, continueToken }: ListSecretsRequest) {
    const path = namespace
      ? `/api/v1/namespaces/${encodeURIComponent(namespace)}/secrets`
      : '/api/v1/secrets';

    return ApiProxy.clusterRequest(
      path,
      { method: 'GET', cluster, timeout: READ_TIMEOUT_MS },
      { labelSelector, limit, ...(continueToken ? { continue: continueToken } : {}) }
    );
  },
};
