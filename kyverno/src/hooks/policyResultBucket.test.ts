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
import { bucketReportResults, filterResultsForPolicy } from './policyResultBucket';

describe('bucketReportResults', () => {
  test('separates cluster-scoped from namespaced policies by slash prefix', () => {
    const { cluster, namespaced } = bucketReportResults([
      {
        results: [
          { policy: 'restrict-images', result: 'pass' },
          { policy: 'restrict-images', result: 'fail' },
          { policy: 'default/require-labels', result: 'fail' },
          { policy: 'default/require-labels', result: 'pass' },
        ],
      },
    ]);

    expect(cluster.get('restrict-images')).toEqual({ fail: 1, total: 2 });
    expect(namespaced.get('default/require-labels')).toEqual({ fail: 1, total: 2 });
    // A namespaced policy must not leak into the cluster bucket and vice-versa.
    expect(cluster.get('default/require-labels')).toBeUndefined();
    expect(namespaced.get('restrict-images')).toBeUndefined();
  });

  test('counts both fail and error as failures', () => {
    const { cluster } = bucketReportResults([
      {
        results: [
          { policy: 'p', result: 'pass' },
          { policy: 'p', result: 'fail' },
          { policy: 'p', result: 'error' },
          { policy: 'p', result: 'warn' },
          { policy: 'p', result: 'skip' },
        ],
      },
    ]);

    // total = 5, but only fail+error count as failures.
    expect(cluster.get('p')).toEqual({ fail: 2, total: 5 });
  });

  test('a ClusterPolicy and a same-named Policy in some namespace do not merge', () => {
    // Regression guard: an early version keyed both into the same map.
    const { cluster, namespaced } = bucketReportResults([
      {
        results: [
          { policy: 'restrict-images', result: 'fail' },
          { policy: 'prod/restrict-images', result: 'pass' },
        ],
      },
    ]);

    expect(cluster.get('restrict-images')).toEqual({ fail: 1, total: 1 });
    expect(namespaced.get('prod/restrict-images')).toEqual({ fail: 0, total: 1 });
  });

  test('merges results across multiple reports', () => {
    const { cluster } = bucketReportResults([
      { results: [{ policy: 'p', result: 'pass' }] },
      { results: [{ policy: 'p', result: 'fail' }] },
      { results: [{ policy: 'p', result: 'pass' }] },
    ]);

    expect(cluster.get('p')).toEqual({ fail: 1, total: 3 });
  });

  test('returns empty buckets for empty input', () => {
    const { cluster, namespaced } = bucketReportResults([]);
    expect(cluster.size).toBe(0);
    expect(namespaced.size).toBe(0);
  });
});

describe('filterResultsForPolicy', () => {
  test('matches a namespaced policy by its namespace/name-prefixed key', () => {
    const results = [
      { policy: 'default/require-labels', result: 'fail', rule: 'check-labels' },
      { policy: 'default/require-labels', result: 'pass', rule: 'check-labels' },
    ];

    expect(filterResultsForPolicy(results, 'require-labels', 'default')).toHaveLength(2);
  });

  test('does not match the same-named policy in a different namespace', () => {
    const results = [{ policy: 'team-a/require-labels', result: 'fail' }];

    expect(filterResultsForPolicy(results, 'require-labels', 'team-b')).toEqual([]);
  });

  test('a same-named ClusterPolicy does not leak into a namespaced lookup', () => {
    // Regression guard: a bare-name comparison (no prefix) would wrongly match
    // this, since 'restrict-images' === 'restrict-images'.
    const results = [{ policy: 'restrict-images', result: 'fail' }];

    expect(filterResultsForPolicy(results, 'restrict-images', 'default')).toEqual([]);
  });

  test('matches a cluster-scoped policy by its bare name', () => {
    const results = [
      { policy: 'restrict-images', result: 'fail' },
      { policy: 'default/restrict-images', result: 'pass' },
    ];

    expect(filterResultsForPolicy(results, 'restrict-images')).toEqual([
      { policy: 'restrict-images', result: 'fail' },
    ]);
  });

  test('returns an empty array when nothing matches', () => {
    const results = [{ policy: 'default/other-policy', result: 'pass' }];

    expect(filterResultsForPolicy(results, 'require-labels', 'default')).toEqual([]);
  });
});
