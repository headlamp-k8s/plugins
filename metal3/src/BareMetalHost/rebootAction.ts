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

/** Annotation that asks the operator to reboot the host; the operator clears it once done. */
export const REBOOT_ANNOTATION = 'reboot.metal3.io';

/** Reboot mode: a soft (graceful) reboot or a hard (power-cycle) reset. */
export type RebootMode = 'soft' | 'hard';

/**
 * Builds the patch that asks the operator to reboot the host. Reboot is imperative,
 * unlike power: adding the annotation triggers one reboot and the operator removes it
 * when done. The mode is carried in the annotation value as `{ mode }`, matching the
 * operator's `RebootAnnotationArguments`.
 *
 * @param mode - Soft for a graceful reboot, hard for a power cycle.
 * @returns The merge-patch body for `KubeObject.patch`.
 */
export function rebootPatch(mode: RebootMode): {
  metadata: { annotations: Record<string, string> };
} {
  return { metadata: { annotations: { [REBOOT_ANNOTATION]: JSON.stringify({ mode }) } } };
}
