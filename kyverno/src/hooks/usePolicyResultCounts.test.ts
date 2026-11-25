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
import { useNamespacedPolicyReportSources, usePolicyReportSources } from './usePolicyReportSources';
import { usePolicyResultCounts } from './usePolicyResultCounts';

vi.mock('../resources/kyvernoReports', () => ({
  EphemeralReport: { useList: vi.fn() },
  ClusterEphemeralReport: { useList: vi.fn() },
}));

vi.mock('../resources/policyReport', () => ({
  PolicyReport: { useList: vi.fn() },
  ClusterPolicyReport: { useList: vi.fn() },
}));

function listResult(items: unknown[] | null, errors: unknown[], isLoading = false) {
  const error = errors[0] ?? null;
  return {
    items,
    error,
    errors: errors.length ? errors : null,
    isLoading,
    isError: Boolean(error),
    *[Symbol.iterator]() {
      yield items;
      yield error;
    },
  };
}

/** Mimics the tuple/object hybrid `KubeObject.useList` returns while a query is in flight. */
function pendingList() {
  return listResult(null, [], true);
}

/** A list that settled with an error, e.g. the CRD is absent or RBAC denied it. */
function erroredList(error: unknown = { status: 404, message: 'not found' }) {
  return listResult(null, [error]);
}

function resolvedList(items: unknown[]) {
  return listResult(items, []);
}

function report(results: { policy: string; result: 'fail' | 'pass'; rule: string }[]) {
  return {
    jsonData: { metadata: { name: 'policy-report', namespace: 'default' } },
    results,
    scope: undefined,
    summary: {},
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const reportClass of [
    PolicyReport,
    ClusterPolicyReport,
    EphemeralReport,
    ClusterEphemeralReport,
  ]) {
    vi.mocked(reportClass.useList).mockReturnValue(resolvedList([]) as any);
  }
});

describe('usePolicyResultCounts', () => {
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

  it('also supports errors from a legacy list tuple', () => {
    const accessError = { status: 403, message: 'forbidden' };
    vi.mocked(PolicyReport.useList).mockReturnValue([null, accessError] as any);
    vi.mocked(ClusterPolicyReport.useList).mockReturnValue(resolvedList([]) as any);

    const { result } = renderHook(() => usePolicyResultCounts());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(accessError);
  });

  it('waits when a list returns partial data and is still loading', () => {
    const items = [report([{ policy: 'restrict-images', result: 'fail', rule: 'images' }])];
    vi.mocked(ClusterEphemeralReport.useList).mockReturnValue(listResult(items, [], true) as any);

    const { result, rerender } = renderHook(() => usePolicyResultCounts());

    expect(result.current.loading).toBe(true);
    vi.mocked(ClusterEphemeralReport.useList).mockReturnValue(resolvedList(items) as any);
    rerender();
    expect(result.current.loading).toBe(false);
    expect(result.current.forCluster('restrict-images')).toEqual({ fail: 1, total: 1 });
  });

  it('preserves all non-404 errors from enhanced lists', () => {
    const accessError = { status: 403, message: 'forbidden' };
    const serverError = { status: 500, message: 'server error' };
    vi.mocked(EphemeralReport.useList).mockReturnValue(
      listResult([], [{ status: 404 }, accessError, serverError]) as any
    );

    const { result } = renderHook(() => usePolicyReportSources());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual({
      errors: [accessError, serverError],
      message: 'forbidden, server error',
    });
  });

  it('keeps identical named resources from different clusters as separate evaluations', () => {
    const entry = {
      policy: 'default/require-labels',
      rule: 'labels',
      result: 'fail' as const,
      resources: [{ apiVersion: 'v1', kind: 'Pod', namespace: 'default', name: 'web' }],
    };
    vi.mocked(PolicyReport.useList).mockReturnValue(
      resolvedList([
        { ...report([entry]), cluster: 'first-cluster' },
        { ...report([entry]), cluster: 'second-cluster' },
      ]) as any
    );
    vi.mocked(EphemeralReport.useList).mockReturnValue(
      resolvedList([{ ...report([entry]), cluster: 'first-cluster' }]) as any
    );

    const { result } = renderHook(() => usePolicyReportSources());

    expect(result.current.reports.map(report => report.cluster)).toEqual([
      'first-cluster',
      'second-cluster',
    ]);
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

  it('keeps results for distinct resources identified by ephemeral report metadata', () => {
    const ephemeralReport = (name: string, metadata: Record<string, unknown>) => ({
      jsonData: {
        metadata: {
          name,
          namespace: 'default',
          ...metadata,
        },
      },
      results: [
        {
          policy: 'default/require-labels',
          result: 'fail' as const,
          rule: 'require-owner',
        },
      ],
      scope: {},
      summary: { fail: 1 },
    });

    vi.mocked(PolicyReport.useList).mockReturnValue(resolvedList([]) as any);
    vi.mocked(ClusterPolicyReport.useList).mockReturnValue(resolvedList([]) as any);
    vi.mocked(EphemeralReport.useList).mockReturnValue(
      resolvedList([
        ephemeralReport('ephemeral-report-a', {
          labels: { 'audit.kyverno.io/resource.uid': 'resource-uid-a' },
        }),
        ephemeralReport('ephemeral-report-b', {
          ownerReferences: [{ uid: 'resource-uid-b' }],
        }),
      ]) as any
    );

    const { result } = renderHook(() => usePolicyResultCounts());

    expect(result.current.forNamespaced('require-labels', 'default')).toEqual({
      fail: 2,
      total: 2,
    });
  });
});

describe('scoped policy report sources', () => {
  it('queries only namespaced report kinds for a namespaced policy', () => {
    const scope = { namespace: 'default', cluster: 'policy-cluster' };
    vi.mocked(EphemeralReport.useList).mockReturnValue(
      resolvedList([
        report([{ policy: 'default/require-labels', result: 'fail', rule: 'labels' }]),
      ]) as any
    );

    const { result } = renderHook(() =>
      useNamespacedPolicyReportSources(scope.namespace, scope.cluster)
    );

    expect(PolicyReport.useList).toHaveBeenCalledWith(scope);
    expect(EphemeralReport.useList).toHaveBeenCalledWith(scope);
    expect(ClusterPolicyReport.useList).not.toHaveBeenCalled();
    expect(ClusterEphemeralReport.useList).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.reports[0].summary).toEqual({ fail: 1 });
  });

  it('queries all report kinds from the cluster that owns a cluster policy', () => {
    const cluster = 'policy-cluster';
    renderHook(() => usePolicyReportSources(cluster));

    expect(PolicyReport.useList).toHaveBeenCalledWith({ cluster, namespace: undefined });
    expect(EphemeralReport.useList).toHaveBeenCalledWith({ cluster, namespace: undefined });
    expect(ClusterPolicyReport.useList).toHaveBeenCalledWith({ cluster });
    expect(ClusterEphemeralReport.useList).toHaveBeenCalledWith({ cluster });
  });

  it('keeps readable durable results when access to ephemeral reports is forbidden', () => {
    vi.mocked(PolicyReport.useList).mockReturnValue(
      resolvedList([
        report([{ policy: 'default/require-labels', result: 'pass', rule: 'labels' }]),
      ]) as any
    );
    vi.mocked(EphemeralReport.useList).mockReturnValue(
      erroredList({ status: 403, message: 'forbidden' }) as any
    );

    const { result } = renderHook(() => useNamespacedPolicyReportSources('default'));

    expect(result.current.error).toBeUndefined();
    expect(result.current.restrictedEphemeralReports).toBe(true);
    expect(result.current.reports[0].summary).toEqual({ pass: 1 });
  });

  it('surfaces other failures alongside restricted ephemeral access', () => {
    vi.mocked(EphemeralReport.useList).mockReturnValue(
      listResult(null, [{ status: 403, message: 'forbidden' }, { status: 500 }]) as any
    );

    const { result } = renderHook(() => useNamespacedPolicyReportSources('default'));

    expect(result.current.error).toMatchObject({ errors: [{ status: 403 }, { status: 500 }] });
    expect(result.current.restrictedEphemeralReports).toBeUndefined();
  });

  it('still reports a forbidden error when no durable report source is available', () => {
    const accessError = { status: 403, message: 'forbidden' };
    vi.mocked(PolicyReport.useList).mockReturnValue(erroredList() as any);
    vi.mocked(EphemeralReport.useList).mockReturnValue(erroredList(accessError) as any);

    const { result } = renderHook(() => useNamespacedPolicyReportSources('default'));

    expect(result.current.error).toBe(accessError);
    expect(result.current.restrictedEphemeralReports).toBeUndefined();
  });
});
