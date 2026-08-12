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

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClusterEphemeralReport, EphemeralReport } from '../resources/kyvernoReports';
import { ClusterPolicyReport, PolicyReport } from '../resources/policyReport';
import { usePolicyResultCounts } from './usePolicyResultCounts';

vi.mock('../resources/kyvernoReports', () => ({
  EphemeralReport: { useList: vi.fn() },
  ClusterEphemeralReport: { useList: vi.fn() },
}));

vi.mock('../resources/policyReport', () => ({
  PolicyReport: { useList: vi.fn() },
  ClusterPolicyReport: { useList: vi.fn() },
}));

/** Mimics the shape `KubeObject.useList` returns for a still-in-flight query. */
function pendingList() {
  return { items: null, error: null, errors: null, isLoading: true, isError: false };
}

/** A list that settled with an error, e.g. the CRD is absent or RBAC denied it. */
function erroredList() {
  const error = { status: 404, message: 'not found' };
  return { items: null, error, errors: [error], isLoading: false, isError: true };
}

function resolvedList(items: unknown[]) {
  return { items, error: null, errors: null, isLoading: false, isError: false };
}

function report(results: { policy: string; result: 'fail' | 'pass'; rule: string }[]) {
  return {
    jsonData: { metadata: { name: 'policy-report', namespace: 'default' } },
    results,
    scope: undefined,
    summary: {},
  };
}

describe('usePolicyResultCounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(EphemeralReport.useList).mockReturnValue(resolvedList([]) as any);
    vi.mocked(ClusterEphemeralReport.useList).mockReturnValue(resolvedList([]) as any);
  });

  it('stops loading once a list settles with an error', () => {
    // Regression: loading used to be derived from `items === null`, which never
    // becomes non-null for an errored list, leaving callers on a spinner forever.
    vi.mocked(PolicyReport.useList).mockReturnValue(erroredList() as any);
    vi.mocked(ClusterPolicyReport.useList).mockReturnValue(erroredList() as any);

    const { result } = renderHook(() => usePolicyResultCounts());

    expect(result.current.loading).toBe(false);
    expect(result.current.forCluster('require-labels')).toBeUndefined();
  });

  it('reports loading while a list is still in flight', () => {
    vi.mocked(PolicyReport.useList).mockReturnValue(pendingList() as any);
    vi.mocked(ClusterPolicyReport.useList).mockReturnValue(resolvedList([]) as any);

    const { result } = renderHook(() => usePolicyResultCounts());

    expect(result.current.loading).toBe(true);
  });

  it('still aggregates the lists that did resolve', () => {
    vi.mocked(PolicyReport.useList).mockReturnValue(
      resolvedList([
        report([
          { policy: 'default/require-labels', result: 'fail', rule: 'require-owner' },
          { policy: 'default/require-labels', result: 'pass', rule: 'require-team' },
        ]),
      ]) as any
    );
    vi.mocked(ClusterPolicyReport.useList).mockReturnValue(erroredList() as any);

    const { result } = renderHook(() => usePolicyResultCounts());

    expect(result.current.loading).toBe(false);
    expect(result.current.forNamespaced('require-labels', 'default')).toEqual({
      fail: 1,
      total: 2,
    });
  });
});
