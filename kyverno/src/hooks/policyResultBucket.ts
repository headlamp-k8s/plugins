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

export interface PolicyResultCounts {
  fail: number;
  total: number;
}

export interface PolicyResultBuckets {
  cluster: Map<string, PolicyResultCounts>;
  namespaced: Map<string, PolicyResultCounts>;
}

// Minimal shape we need from a PolicyReport / ClusterPolicyReport — kept
// SDK-free so this module is unit-testable without the Headlamp host shim.
export interface ResultEntryLike {
  policy: string;
  result: string;
}

export interface ReportLike {
  results: ResultEntryLike[];
}

/**
 * Splits PolicyReport result entries by policy scope.
 *
 * Kyverno prefixes namespaced-policy results with `<namespace>/<name>`; cluster
 * policies stay unprefixed. The two maps keep these spaces separate so a
 * ClusterPolicy and a same-named Policy in some namespace don't merge counts.
 */
export function bucketReportResults(reports: ReportLike[]): PolicyResultBuckets {
  const cluster = new Map<string, PolicyResultCounts>();
  const namespaced = new Map<string, PolicyResultCounts>();

  function bump(map: Map<string, PolicyResultCounts>, key: string, isFail: boolean) {
    const entry = map.get(key) || { fail: 0, total: 0 };
    entry.total += 1;
    if (isFail) entry.fail += 1;
    map.set(key, entry);
  }

  for (const report of reports) {
    for (const r of report.results) {
      const isFail = r.result === 'fail' || r.result === 'error';
      if (r.policy.indexOf('/') > 0) {
        bump(namespaced, r.policy, isFail);
      } else {
        bump(cluster, r.policy, isFail);
      }
    }
  }

  return { cluster, namespaced };
}
