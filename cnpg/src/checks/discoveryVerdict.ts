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

import { MaybeApiError } from '../utils/permissions';

/**
 * The answer to "is CloudNativePG installed here?".
 *
 * `null` is not a third state of the cluster but a statement about the check:
 * it could not be answered. The sidebar shows the plugin while the answer is
 * null, because hiding it would be an assertion nobody has evidence for.
 */
export type InstalledVerdict = boolean | null;

/**
 * Classifies a failed discovery request.
 *
 * Only the API server saying the API group is not served — a 404 — is evidence
 * that the operator is absent. Every other failure says something about the
 * request or the network and nothing about the cluster, so it yields null.
 */
export function verdictForDiscoveryError(
  error: MaybeApiError | null | undefined
): InstalledVerdict {
  if (error?.status === 404) {
    return false;
  }

  // Some transports drop the status code and surface only the proxy's body.
  if (!error?.status && error?.message?.includes('404')) {
    return false;
  }

  return null;
}
