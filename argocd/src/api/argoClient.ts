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

import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { argocdApiVersion } from '../resources/application';

const request = ApiProxy.request;

// Why not the Argo CD REST API?
// -----------------------------
// The Argo CD REST API cannot be reached from the plugin: Headlamp routes all
// calls through the Kubernetes apiserver service proxy, which strips the
// `Authorization: Bearer` header (consumed for its own auth) and the browser
// strips the `Cookie` header (a forbidden header). So the Argo CD session token
// can never reach argocd-server. Instead we drive Argo CD the Kubernetes-native
// way, by writing to the Application custom resource directly — no Argo CD auth
// needed, just the cluster RBAC the user already has.

const APPLICATIONS_API_ROOT = `/apis/${argocdApiVersion}`;

/** Builds the K8s API path for a single Application custom resource. */
function applicationPath(name: string, namespace: string): string {
  return `${APPLICATIONS_API_ROOT}/namespaces/${namespace}/applications/${name}`;
}

/**
 * Sends a JSON merge-patch to an Application custom resource via the Kubernetes API.
 *
 * @param name - The name of the Argo CD Application to patch.
 * @param namespace - The namespace where the Application is deployed.
 * @param patch - The JSON merge-patch object to apply to the Application.
 * @returns A promise resolving to the API response from the Kubernetes server.
 */
async function mergePatchApplication(name: string, namespace: string, patch: object) {
  try {
    return await request(applicationPath(name, namespace), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/merge-patch+json',
      },
      body: JSON.stringify(patch),
    });
  } catch (err: unknown) {
    const errObj = typeof err === 'object' && err !== null ? (err as Record<string, unknown>) : {};
    const status = errObj.status ?? errObj.statusCode;
    const message =
      err instanceof Error ? err.message : errObj.message ? String(errObj.message) : String(err);

    // Prefer the structured status code; only fall back to message matching
    // when the error has no status property, to avoid false positives.
    const isForbidden = status === 403 || (status === undefined && message.includes('403'));

    if (isForbidden) {
      throw new Error(
        `Permission denied: your Kubernetes RBAC role does not allow patching Application ` +
          `resources in the "${namespace}" namespace. ` +
          'Ask your cluster admin to grant you patch access to applications.argoproj.io.'
      );
    }

    throw err instanceof Error ? err : new Error(message);
  }
}

/**
 * Triggers a sync of an Argo CD Application by setting its `.operation` field.
 *
 * The Argo CD application-controller watches this field and runs the sync, just
 * as it does when the Argo CD UI or CLI initiates one — no Argo CD API auth required.
 *
 * When {@link revision} is omitted the `revision` key is left out of the patch
 * so the controller falls back to `spec.source.targetRevision`, matching the
 * behaviour of the Argo CD UI.
 *
 * @param name - The Application resource name.
 * @param namespace - The namespace the Application lives in (usually "argocd").
 * @param revision - Optional Git revision to sync to. When omitted the
 *   controller resolves the app's configured `targetRevision`.
 */
export function syncApplication(name: string, namespace: string, revision?: string) {
  const sync: Record<string, string> = {};
  if (revision !== undefined) {
    sync.revision = revision;
  }
  return mergePatchApplication(name, namespace, {
    operation: {
      initiatedBy: { username: 'headlamp' },
      sync,
    },
  });
}

/**
 * Requests a refresh of an Argo CD Application by setting the refresh annotation.
 *
 * The controller reconciles the app against its source when it sees this annotation.
 *
 * @param name - The Application resource name.
 * @param namespace - The namespace the Application lives in (usually "argocd").
 * @param type - The refresh type: "normal" (default) or "hard".
 */
export function refreshApplication(
  name: string,
  namespace: string,
  type: 'normal' | 'hard' = 'normal'
) {
  return mergePatchApplication(name, namespace, {
    metadata: {
      annotations: {
        'argocd.argoproj.io/refresh': type,
      },
    },
  });
}
