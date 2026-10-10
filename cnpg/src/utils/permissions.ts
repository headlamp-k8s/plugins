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

/** The subset of Headlamp's ApiError this plugin needs.
 *
 * Declared structurally rather than imported: Headlamp's apiProxy module is not
 * in the bundler's externals map, so importing its types risks an import path
 * that only fails in the browser.
 */
export interface MaybeApiError {
  status?: number;
  message?: string;
}

/** Describes an RBAC rule the user was denied. */
export interface MissingPermission {
  verb: string;
  resource: string;
  apiGroup: string;
  namespace?: string;
}

/**
 * Reports whether an API error was caused by the user lacking permission,
 * as opposed to the resource being absent or the request failing otherwise.
 */
export function isForbidden(error: MaybeApiError | null | undefined): boolean {
  if (!error) {
    return false;
  }

  if (error.status === 403 || error.status === 401) {
    return true;
  }

  // Some transports surface the API server's message without a status code, and
  // may have recapitalised it on the way, so the match is case-insensitive.
  return !error.status && !!error.message?.toLowerCase().includes('forbidden');
}

/**
 * Renders the RBAC rule the user is missing, in the same shape the API server
 * and `kubectl auth can-i` use, so it can be handed straight to an admin.
 */
export function describeMissingPermission({
  verb,
  resource,
  apiGroup,
  namespace,
}: MissingPermission): string {
  const scope = namespace ? `in namespace "${namespace}"` : 'at the cluster scope';
  return `${verb} ${resource}.${apiGroup} ${scope}`;
}

/** Several resources denied under the same verb and API group. */
export interface MissingPermissions {
  verb: string;
  resources: string[];
  apiGroup: string;
  namespace?: string;
}

/**
 * Describes each denied resource separately, so a view can give each its own
 * line.
 *
 * Returning a list rather than a joined string is the point: two permissions
 * rendered end to end read as one malformed rule, because each already ends in
 * a scope clause and begins with a verb.
 */
export function describeMissingPermissions({
  verb,
  resources,
  apiGroup,
  namespace,
}: MissingPermissions): string[] {
  return resources.map(resource =>
    describeMissingPermission({ verb, resource, apiGroup, namespace })
  );
}
