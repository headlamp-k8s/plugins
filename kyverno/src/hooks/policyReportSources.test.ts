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

import { describe, expect, test } from 'vitest';
import { PolicyReportResult } from '../resources/policyReport';
import {
  combineReportSources,
  policyIdentity,
  PolicyReportSource,
  reportSourceErrorMessage,
} from './policyReportSources';

function report(
  name: string,
  uid: string,
  results: PolicyReportResult[],
  namespace?: string
): PolicyReportSource {
  return {
    metadata: { name, namespace },
    scope: { uid },
    summary: {},
    results,
  };
}

describe('combineReportSources', () => {
  test('combines legacy and Kyverno v2 report source lists', () => {
    const policyReport = report('policy-report', 'uid-1', [
      { policy: 'default/require-labels', rule: 'labels', result: 'pass' },
    ]);
    const clusterPolicyReport = report('cluster-policy-report', 'uid-2', [
      { policy: 'restrict-images', rule: 'images', result: 'pass' },
    ]);
    const ephemeralReport = report('ephemeral-report', 'uid-3', [
      { policy: 'default/require-requests', rule: 'requests', result: 'fail' },
    ]);
    const clusterEphemeralReport = report('cluster-ephemeral-report', 'uid-4', [
      { policy: 'require-owner', rule: 'owner', result: 'warn' },
    ]);
    const { reports, loading } = combineReportSources([
      { items: [policyReport] },
      { items: [clusterPolicyReport] },
      { items: [ephemeralReport] },
      { items: [clusterEphemeralReport] },
    ]);

    expect(reports.map(item => item.metadata.name)).toEqual([
      'policy-report',
      'cluster-policy-report',
      'ephemeral-report',
      'cluster-ephemeral-report',
    ]);
    expect(loading).toBe(false);
  });

  test('waits for source lists that are still loading', () => {
    const policyReport = report('policy-report', 'uid-1', [
      { policy: 'restrict-images', rule: 'images', result: 'pass' },
    ]);
    const { reports, loading } = combineReportSources([
      { items: [policyReport] },
      { items: null },
    ]);

    expect(reports).toHaveLength(1);
    expect(loading).toBe(true);
  });

  test('treats a missing optional source as empty', () => {
    const policyReport = report('policy-report', 'uid-1', [
      { policy: 'restrict-images', rule: 'images', result: 'pass' },
    ]);
    const { reports, loading, error } = combineReportSources([
      { items: [policyReport] },
      { items: null, error: { status: 404, message: 'not found' } },
    ]);

    expect(reports).toHaveLength(1);
    expect(loading).toBe(false);
    expect(error).toBeUndefined();
  });

  test('propagates non-404 source errors instead of returning partial totals', () => {
    const accessError = { status: 403, message: 'forbidden' };
    const { loading, error } = combineReportSources([
      { items: [] },
      { items: null, error: accessError },
    ]);

    expect(loading).toBe(false);
    expect(error).toBe(accessError);
  });

  test('deduplicates overlapping results and keeps the latest timestamp', () => {
    const durable = report('policy-report', 'resource-uid', [
      {
        source: 'kyverno',
        policy: 'restrict-images',
        rule: 'images',
        result: 'pass',
        timestamp: { seconds: 10, nanos: 0 },
      },
    ]);
    const ephemeral = report('ephemeral-report', 'resource-uid', [
      {
        source: 'kyverno',
        policy: 'restrict-images',
        rule: 'images',
        result: 'fail',
        timestamp: { seconds: 11, nanos: 0 },
      },
    ]);

    const { reports } = combineReportSources([{ items: [durable] }, { items: [ephemeral] }]);

    expect(reports).toHaveLength(1);
    expect(reports[0].metadata.name).toBe('ephemeral-report');
    expect(reports[0].results).toEqual(ephemeral.results);
    expect(reports[0].summary).toEqual({ fail: 1 });
  });

  test('keeps the durable result when duplicate timestamps are equal', () => {
    const result: PolicyReportResult = {
      source: 'kyverno',
      policy: 'restrict-images',
      rule: 'images',
      result: 'pass',
      timestamp: { seconds: 10, nanos: 1 },
    };
    const durable = report('policy-report', 'resource-uid', [result]);
    const ephemeral = report('ephemeral-report', 'resource-uid', [
      { ...result, result: 'fail' },
    ]);

    const { reports } = combineReportSources([{ items: [durable] }, { items: [ephemeral] }]);

    expect(reports).toHaveLength(1);
    expect(reports[0].metadata.name).toBe('policy-report');
    expect(reports[0].results[0].result).toBe('pass');
  });
});

describe('policyIdentity', () => {
  test('qualifies namespaced policies without changing ClusterPolicy names', () => {
    expect(policyIdentity('restrict-images', 'team-a')).toBe('team-a/restrict-images');
    expect(policyIdentity('restrict-images')).toBe('restrict-images');
  });
});

describe('reportSourceErrorMessage', () => {
  test('uses API error messages and provides a fallback', () => {
    expect(reportSourceErrorMessage({ status: 403, message: 'forbidden' })).toBe('forbidden');
    expect(reportSourceErrorMessage({ status: 500 })).toBe('Unknown error');
  });
});
