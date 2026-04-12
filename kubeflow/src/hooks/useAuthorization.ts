/**
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

import { KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import { useEffect, useState } from 'react';

interface UseAuthorizationOptions {
  /** The resource class for which auth will be checked (e.g. Pod). */
  item: KubeObjectClass | null;
  /** The verb associated with the permissions being verifying. */
  authVerb: string;
  /** The subresource for which the permissions are being verified (e.g. "log" when checking for a pod's log). */
  subresource?: string;
  /** The namespace for which we're checking the permission, if applied. */
  namespace?: string;
  /** The cluster for which we're checking the permission. */
  cluster?: string;
  /** Callback for when an error occurs. */
  onError?: (err: Error) => void;
}

const VALID_AUTH_VERBS = [
  'create',
  'get',
  'list',
  'watch',
  'update',
  'patch',
  'delete',
  'deletecollection',
];

/**
 * Hook to check if the user has permission for a specific action.
 * Returns { allowed: boolean | null, isLoading: boolean }
 * - allowed: true if authorized, false if not authorized, null while checking or if item is null
 * - isLoading: true while the authorization check is in progress
 */
export function useAuthorization({
  item,
  authVerb,
  subresource,
  namespace,
  cluster,
  onError,
}: UseAuthorizationOptions): { allowed: boolean | null; isLoading: boolean } {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!item || !VALID_AUTH_VERBS.includes(authVerb)) {
      return;
    }

    let mounted = true;
    setIsLoading(true);

    item
      .getAuthorization(authVerb, { subresource, namespace }, cluster)
      .then(res => {
        if (mounted) {
          setData(res);
          setError(null);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err);
          if (onError) {
            onError(err);
          }
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [item, authVerb, subresource, namespace, cluster, onError]);

  if (!item || !VALID_AUTH_VERBS.includes(authVerb)) {
    return { allowed: null, isLoading: false };
  }

  if (error) {
    return { allowed: false, isLoading: false };
  }

  const allowed = data?.status?.allowed ?? false;
  return { allowed: isLoading ? null : allowed, isLoading };
}
