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

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
import { KyvernoCRDStatus, useKyvernoCRDs } from './useKyvernoCRDs';
import { usePolicyCounts } from './usePolicyCounts';

// The resource classes extend KubeObject from the Headlamp SDK, which doesn't resolve under
// vitest (see policyImpact.test.ts), so their modules are replaced by stand-ins carrying only
// what the hook reads: the plural name discovery reports, and useList.
vi.mock('../resources/kyvernoPolicy', () => ({
  KyvernoClusterPolicy: { apiName: 'clusterpolicies', useList: vi.fn() },
  KyvernoPolicy: { apiName: 'policies', useList: vi.fn() },
}));

vi.mock('../resources/celPolicies', () => {
  const kind = (apiName: string) => ({ apiName, useList: vi.fn() });
  return {
    ValidatingPolicy: kind('validatingpolicies'),
    NamespacedValidatingPolicy: kind('namespacedvalidatingpolicies'),
    ImageValidatingPolicy: kind('imagevalidatingpolicies'),
    NamespacedImageValidatingPolicy: kind('namespacedimagevalidatingpolicies'),
    MutatingPolicy: kind('mutatingpolicies'),
    NamespacedMutatingPolicy: kind('namespacedmutatingpolicies'),
    GeneratingPolicy: kind('generatingpolicies'),
    NamespacedGeneratingPolicy: kind('namespacedgeneratingpolicies'),
    DeletingPolicy: kind('deletingpolicies'),
    NamespacedDeletingPolicy: kind('namespaceddeletingpolicies'),
  };
});

vi.mock('./useKyvernoCRDs', () => ({ useKyvernoCRDs: vi.fn() }));

const CEL_KINDS = [
  ValidatingPolicy,
  NamespacedValidatingPolicy,
  ImageValidatingPolicy,
  NamespacedImageValidatingPolicy,
  MutatingPolicy,
  NamespacedMutatingPolicy,
  GeneratingPolicy,
  NamespacedGeneratingPolicy,
  DeletingPolicy,
  NamespacedDeletingPolicy,
];
const ALL_KINDS = [KyvernoClusterPolicy, KyvernoPolicy, ...CEL_KINDS];

/** Discovery result for a cluster with every Kyverno CRD installed, unless overridden. */
function crds(overrides: Partial<KyvernoCRDStatus> = {}): KyvernoCRDStatus {
  return {
    legacy: true,
    cel: true,
    cleanup: true,
    reports: true,
    exceptions: true,
    ephemeralReports: true,
    celResources: new Set(CEL_KINDS.map(kind => kind.apiName)),
    loading: false,
    ...overrides,
  };
}

/** Mimics the `[items, error]` pair `KubeObject.useList` returns while a list is in flight. */
const pendingList = () => [null, null];
/** A list that settled with an error, e.g. the CRD is absent or RBAC denied it. */
const failedList = () => [null, new Error('forbidden')];
const resolvedList = (items: unknown[]) => [items, null];

function mockList(kind: unknown, list: unknown[]) {
  vi.mocked((kind as { useList: () => unknown }).useList).mockReturnValue(list);
}

describe('usePolicyCounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useKyvernoCRDs).mockReturnValue(crds());
    for (const kind of ALL_KINDS) {
      mockList(kind, resolvedList([]));
    }
  });

  it('counts CEL policies when there are no legacy ones (#1448)', () => {
    mockList(
      ValidatingPolicy,
      resolvedList([{ validationActions: ['Audit'] }, { validationActions: ['Audit'] }])
    );
    mockList(ImageValidatingPolicy, resolvedList([{ validationActions: ['Audit'] }]));
    mockList(MutatingPolicy, resolvedList([{}, {}, {}]));

    const { result } = renderHook(() => usePolicyCounts());

    expect(result.current).toEqual({ total: 6, enforce: 0, audit: 3, loading: false });
  });

  it('adds up legacy and CEL policies, namespaced variants included', () => {
    mockList(KyvernoClusterPolicy, resolvedList([{ validationFailureAction: 'Enforce' }]));
    mockList(KyvernoPolicy, resolvedList([{ validationFailureAction: 'Audit' }]));
    mockList(NamespacedValidatingPolicy, resolvedList([{ validationActions: ['Deny'] }]));
    mockList(NamespacedImageValidatingPolicy, resolvedList([{ validationActions: ['Warn'] }]));
    mockList(NamespacedGeneratingPolicy, resolvedList([{}]));
    mockList(DeletingPolicy, resolvedList([{}]));

    const { result } = renderHook(() => usePolicyCounts());

    expect(result.current).toEqual({ total: 6, enforce: 2, audit: 2, loading: false });
  });

  it('ignores kinds discovery did not find, so their lists never hold the counts', () => {
    // Legacy-only cluster: every CEL list would only ever 404.
    vi.mocked(useKyvernoCRDs).mockReturnValue(crds({ cel: false, celResources: new Set() }));
    mockList(KyvernoClusterPolicy, resolvedList([{ validationFailureAction: 'Audit' }]));
    for (const kind of CEL_KINDS) {
      mockList(kind, pendingList());
    }

    const { result } = renderHook(() => usePolicyCounts());

    expect(result.current).toEqual({ total: 1, enforce: 0, audit: 1, loading: false });
  });

  it('works when the legacy CRDs are not installed', () => {
    vi.mocked(useKyvernoCRDs).mockReturnValue(crds({ legacy: false }));
    mockList(KyvernoClusterPolicy, pendingList());
    mockList(KyvernoPolicy, pendingList());
    mockList(ValidatingPolicy, resolvedList([{ validationActions: ['Deny'] }]));

    const { result } = renderHook(() => usePolicyCounts());

    expect(result.current).toEqual({ total: 1, enforce: 1, audit: 0, loading: false });
  });

  it('skips CEL kinds the installed Kyverno version does not serve', () => {
    // Before Kyverno 1.17 the namespaced CEL kinds are missing from policies.kyverno.io/v1.
    vi.mocked(useKyvernoCRDs).mockReturnValue(
      crds({
        celResources: new Set([
          'validatingpolicies',
          'imagevalidatingpolicies',
          'mutatingpolicies',
          'generatingpolicies',
          'deletingpolicies',
        ]),
      })
    );
    mockList(ValidatingPolicy, resolvedList([{ validationActions: ['Audit'] }]));
    mockList(NamespacedValidatingPolicy, pendingList());

    const { result } = renderHook(() => usePolicyCounts());

    expect(result.current).toEqual({ total: 1, enforce: 0, audit: 1, loading: false });
  });

  it('settles when RBAC denies an installed kind', () => {
    mockList(ValidatingPolicy, failedList());
    mockList(MutatingPolicy, resolvedList([{}]));

    const { result } = renderHook(() => usePolicyCounts());

    expect(result.current).toEqual({ total: 1, enforce: 0, audit: 0, loading: false });
  });

  it('stays loading while an installed kind is still being listed', () => {
    mockList(GeneratingPolicy, pendingList());

    const { result } = renderHook(() => usePolicyCounts());

    expect(result.current.loading).toBe(true);
  });

  it('stays loading until discovery has answered', () => {
    vi.mocked(useKyvernoCRDs).mockReturnValue(
      crds({ legacy: false, cel: false, celResources: new Set(), loading: true })
    );

    const { result } = renderHook(() => usePolicyCounts());

    expect(result.current.loading).toBe(true);
  });
});
