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
// them, so Kyverno's defaults apply here as well: a legacy policy without
// validationFailureAction audits, a CEL policy without validationActions denies.

/** ClusterPolicy / Policy (kyverno.io/v1). */
export interface LegacyPolicyLike {
  validationFailureAction: string;
}

/** ValidatingPolicy / ImageValidatingPolicy and their namespaced variants. */
export interface ValidatingPolicyLike {
  validationActions: string[];
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

/**
 * Counts policies for the Overview's Total / Enforce / Audit cards.
 *
 * Legacy policies keep their original rule: Enforce when `validationFailureAction` is
 * `Enforce`, Audit otherwise. CEL validating kinds go by `validationActions`: `Deny` blocks
 * the request, so it counts as Enforce, while `Audit` and `Warn` only report it and count as
 * Audit. Kinds without a validation action only add to Total.
 */
export function countPolicies({
  legacy = [],
  validating = [],
  other = [],
}: PolicyCountInput): PolicyCounts {
  const legacyEnforce = legacy.filter(p => p.validationFailureAction === 'Enforce').length;
  let enforce = legacyEnforce;
  let audit = legacy.length - legacyEnforce;

  for (const { validationActions } of validating) {
    if (validationActions.includes('Deny')) {
      enforce++;
    } else if (validationActions.includes('Audit') || validationActions.includes('Warn')) {
      audit++;
    }
  }

  return { total: legacy.length + validating.length + other.length, enforce, audit };
}
