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

import Deployment from '@kinvolk/headlamp-plugin/lib/k8s/deployment';
import { useAuthorization } from '../../../../hooks/useAuthorization';

/**
 * Checks whether the user may restart a Knative Service, which needs permission to list, watch
 * and patch Deployments.
 *
 * @param namespace - Namespace of the Knative Service.
 * @param cluster - Cluster of the Knative Service.
 * @returns `allowed`: false as soon as any check is denied, true when all three are allowed, and
 * null otherwise; `isLoading`: true while any of the checks is still running.
 */
export function useCanRestartKService(
  namespace?: string,
  cluster?: string
): { allowed: boolean | null; isLoading: boolean } {
  const patch = useAuthorization({ item: Deployment, authVerb: 'patch', namespace, cluster });
  const list = useAuthorization({ item: Deployment, authVerb: 'list', namespace, cluster });
  const watch = useAuthorization({ item: Deployment, authVerb: 'watch', namespace, cluster });
  const allowed = [patch.allowed, list.allowed, watch.allowed];
  const isLoading = patch.isLoading || list.isLoading || watch.isLoading;

  if (allowed.includes(false)) {
    return { allowed: false, isLoading };
  }
  return { allowed: allowed.every(value => value === true) ? true : null, isLoading };
}
