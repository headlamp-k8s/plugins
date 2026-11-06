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

import { useMemo } from 'react';
import {
  DeletingPolicy,
  GeneratingPolicy,
  ImageValidatingPolicy,
  MutatingPolicy,
  NamespacedDeletingPolicy,
  NamespacedGeneratingPolicy,
  NamespacedImageValidatingPolicy,
  NamespacedMutatingPolicy,
  NamespacedValidatingPolicy,
  ValidatingPolicy,
} from '../resources/celPolicies';
import { KyvernoClusterPolicy, KyvernoPolicy } from '../resources/kyvernoPolicy';
import {
  countPolicies,
  LegacyPolicyLike,
  PolicyCounts,
  ValidatingPolicyLike,
} from './policyCounts';
import { useKyvernoCRDs } from './useKyvernoCRDs';

export interface PolicyCountsResult extends PolicyCounts {
  loading: boolean;
}

interface CountedList<T> {
  items: T[];
  pending: boolean;
}

/**
 * Reduces a `useList()` result to what the counts need. A list stays pending only while it
 * has neither items nor an error, so one that fails (RBAC denies the kind, say) settles with
 * nothing to count instead of holding the cards on their placeholder. A kind discovery didn't
 * find is skipped outright: its list can only ever fail.
 */
function countedList<T>(
  [items, error]: readonly [T[] | null, unknown],
  installed: boolean
): CountedList<T> {
  if (!installed) {
    return { items: [], pending: false };
  }
  return { items: items ?? [], pending: items === null && !error };
}

/**
 * Total / Enforce / Audit counts across every Kyverno policy kind installed on the cluster,
 * legacy (kyverno.io/v1) and CEL-based (policies.kyverno.io/v1) alike.
 */
export function usePolicyCounts(): PolicyCountsResult {
  const crds = useKyvernoCRDs();
  // The CEL kinds arrived across several Kyverno releases, so each one is checked on its own
  // rather than inferred from the policies.kyverno.io/v1 group being present.
  const installed = (resourceClass: { apiName: string }) =>
    crds.celResources.has(resourceClass.apiName);

  // Hooks can't be called conditionally, so every kind is listed and `installed` decides
  // which of the lists count.
  const legacy: CountedList<LegacyPolicyLike>[] = [
    countedList(KyvernoClusterPolicy.useList(), crds.legacy),
    countedList(KyvernoPolicy.useList(), crds.legacy),
  ];
  const validating: CountedList<ValidatingPolicyLike>[] = [
    countedList(ValidatingPolicy.useList(), installed(ValidatingPolicy)),
    countedList(NamespacedValidatingPolicy.useList(), installed(NamespacedValidatingPolicy)),
    countedList(ImageValidatingPolicy.useList(), installed(ImageValidatingPolicy)),
    countedList(
      NamespacedImageValidatingPolicy.useList(),
      installed(NamespacedImageValidatingPolicy)
    ),
  ];
  const other: CountedList<unknown>[] = [
    countedList(MutatingPolicy.useList(), installed(MutatingPolicy)),
    countedList(NamespacedMutatingPolicy.useList(), installed(NamespacedMutatingPolicy)),
    countedList(GeneratingPolicy.useList(), installed(GeneratingPolicy)),
    countedList(NamespacedGeneratingPolicy.useList(), installed(NamespacedGeneratingPolicy)),
    countedList(DeletingPolicy.useList(), installed(DeletingPolicy)),
    countedList(NamespacedDeletingPolicy.useList(), installed(NamespacedDeletingPolicy)),
  ];

  const { total, enforce, audit } = countPolicies({
    legacy: legacy.flatMap(list => list.items),
    validating: validating.flatMap(list => list.items),
    other: other.flatMap(list => list.items),
  });
  // Until discovery answers no kind counts as installed, so wait for it as well.
  const loading = crds.loading || [...legacy, ...validating, ...other].some(list => list.pending);

  return useMemo(() => ({ total, enforce, audit, loading }), [total, enforce, audit, loading]);
}
