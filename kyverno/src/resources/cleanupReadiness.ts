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

import { PolicyCondition } from './kyvernoPolicy';

// Kept in its own module, with no @kinvolk/headlamp-plugin/lib/k8s/cluster import anywhere in its
// chain, specifically so it stays unit-testable: that subpath only resolves at real build time
// through a rollup-only external/globals mapping, not a file vitest can resolve, so anything that
// imports it (CleanupPolicyBase in cleanupPolicy.ts, which this logic used to live directly on)
// can't be imported from a test either, even just for a plain function defined alongside it.
//
// Kyverno v1.16.4's cleanup controller (updateCleanupPolicyStatus) writes
// status.lastExecutionTime after a successful execution but never sets a Ready condition at all,
// confirmed against the real source. `ready` below therefore reads false for a perfectly healthy,
// successfully-running cleanup policy exactly the same way it reads false for a genuinely broken
// one, there's no Ready condition present to tell the two apart. `readyUnknown` is the thing that
// actually can: true only when no Ready condition exists at all (the ambiguous case `ready` alone
// can't answer), false once Kyverno has set one explicitly, at which point `ready` is trustworthy
// on its own.
export function interpretCleanupReadiness(conditions: PolicyCondition[] | undefined): {
  ready: boolean;
  readyUnknown: boolean;
} {
  const readyCondition = conditions?.find(c => c.type === 'Ready');
  return {
    ready: readyCondition?.status === 'True',
    readyUnknown: !readyCondition,
  };
}
