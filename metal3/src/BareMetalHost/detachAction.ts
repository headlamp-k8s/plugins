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

import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

/** Annotation that takes the host out of the operator's management without deleting it. */
export const DETACHED_ANNOTATION = 'baremetalhost.metal3.io/detached';

/** The detach action a host offers, derived from whether the annotation is present. */
export interface DetachIntent {
  /** Whether the host is currently detached. */
  isDetached: boolean;
  /** Whether the action will detach (true) or re-attach (false). */
  targetDetached: boolean;
  /** Button label naming the action that will happen. */
  label: string;
}

/**
 * Derives the detach action to offer for a host from the presence of the detached
 * annotation. Pure, so the button's label and target can be unit-tested without a
 * running cluster.
 *
 * @param host - The BareMetalHost to read the annotation from.
 * @returns The current detached state, the target, and the button label.
 */
export function getDetachIntent(host: KubeObject): DetachIntent {
  const isDetached = host.jsonData.metadata?.annotations?.[DETACHED_ANNOTATION] !== undefined;
  return {
    isDetached,
    targetDetached: !isDetached,
    label: isDetached ? 'Attach' : 'Detach',
  };
}

/**
 * Builds the merge patch that detaches or re-attaches a host. Detaching adds the
 * annotation; attaching removes it by setting it to null, which a merge patch drops.
 *
 * @param detach - True to detach, false to re-attach.
 * @returns The merge-patch body for `KubeObject.patch`.
 */
export function detachPatch(detach: boolean): {
  metadata: { annotations: Record<string, string | null> };
} {
  return { metadata: { annotations: { [DETACHED_ANNOTATION]: detach ? '' : null } } };
}
