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

// Kept apart from kyvernoPolicy.ts, which imports KubeObject at runtime and so
// can't be loaded by the unit tests (see the note in policyImpact.test.ts).
import type { KyvernoPolicySpec } from './kyvernoPolicy';

// Derives the effective enforcement action from a policy spec.
// Rule-level validate.failureAction overrides the spec-level action. Resolve
// each validation rule's effective action before checking agreement; differing
// actions produce 'Mixed', and the fallback action defaults to 'Audit'.
// Kyverno accepts lowercase 'audit'/'enforce' as equivalent to 'Audit'/'Enforce';
// normalize before comparing so they don't produce a false 'Mixed'.
export function effectiveEnforcementAction(spec: KyvernoPolicySpec | undefined): string {
  const normalize = (a: string) => (a === 'enforce' ? 'Enforce' : a === 'audit' ? 'Audit' : a);
  const fallback = normalize(spec?.validationFailureAction ?? 'Audit');
  const ruleActions = new Set(
    (spec?.rules ?? [])
      .filter(r => r.validate)
      .map(r => normalize(r.validate!.failureAction ?? fallback))
  );
  if (ruleActions.size === 1) return [...ruleActions][0];
  if (ruleActions.size > 1) return 'Mixed';
  return fallback;
}

// Whether a policy blocks anything: a 'Mixed' policy still enforces some of its
// rules, so it counts as Enforce, like Kyverno's own HasValidateEnforce().
export function isEnforcing(action: string): boolean {
  return action === 'Enforce' || action === 'Mixed';
}
