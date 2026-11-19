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

// Minimal shapes the Overview's policy counts need, kept SDK-free so this module is
// unit-testable without the Headlamp host shim. The resource classes' own getters satisfy
// them, but countPolicies() applies Kyverno's defaults itself rather than relying on those
// getters: a legacy policy that sets no failure action audits, and a CEL policy with a
// missing or empty validationActions denies.

/** ClusterPolicy / Policy (kyverno.io/v1). */
export interface LegacyPolicyLike {
  /** Policy-wide action, deprecated since Kyverno 1.13 in favor of each rule's failureAction. */
  validationFailureAction?: string;
  rules?: readonly { validate?: { failureAction?: string } }[];
}

/** ValidatingPolicy / ImageValidatingPolicy and their namespaced variants. */
export interface ValidatingPolicyLike {
  validationActions?: string[];
}

export interface PolicyCountInput {
  legacy?: readonly LegacyPolicyLike[];
  validating?: readonly ValidatingPolicyLike[];
  /** CEL kinds without a validation action: mutating, generating and deleting policies. */
  other?: readonly unknown[];
}

export interface PolicyCounts {
  total: number;
  enforce: number;
  audit: number;
}

// Kyverno's ValidationFailureAction.Enforce(): the deprecated lowercase value still enforces.
const enforces = (action: string | undefined) => action === 'Enforce' || action === 'enforce';

/**
 * Mirrors Kyverno's Spec.HasValidateEnforce(): a validate rule's failureAction can make the
 * policy enforce, and so can the policy-wide value, even when the rules set their own.
 */
function legacyEnforces({ validationFailureAction, rules = [] }: LegacyPolicyLike): boolean {
  return (
    rules.some(rule => enforces(rule.validate?.failureAction)) || enforces(validationFailureAction)
  );
}

/**
 * Counts policies for the Overview's Total / Enforce / Audit cards.
 *
 * A legacy policy counts as Enforce when Kyverno itself considers it enforcing: a validate rule
 * sets `failureAction: Enforce`, or the policy-wide `validationFailureAction` is `Enforce` (or
 * the deprecated `enforce`). Every other legacy policy counts as Audit. CEL validating kinds go
 * by `validationActions`: `Deny` blocks the request, so it counts as Enforce, while `Audit` and
 * `Warn` only report it and count as Audit. A missing or empty `validationActions` counts as
 * `Deny`, as Kyverno's `ValidationActions()` defaults it. Mutating, generating and deleting
 * policies have no validation action and only add to Total.
 */
export function countPolicies({
  legacy = [],
  validating = [],
  other = [],
}: PolicyCountInput): PolicyCounts {
  const legacyEnforce = legacy.filter(policy => legacyEnforces(policy)).length;
  let enforce = legacyEnforce;
  let audit = legacy.length - legacyEnforce;

  for (const { validationActions } of validating) {
    const actions = validationActions?.length ? validationActions : ['Deny'];
    if (actions.includes('Deny')) {
      enforce++;
    } else if (actions.includes('Audit') || actions.includes('Warn')) {
      audit++;
    }
  }

  return { total: legacy.length + validating.length + other.length, enforce, audit };
}
