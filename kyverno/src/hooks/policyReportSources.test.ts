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
import { combineReportSources } from './policyReportSources';

describe('combineReportSources', () => {
  test('combines legacy and Kyverno v2 report source lists', () => {
    const { reports, loading } = combineReportSources([
      { items: ['policy-report'] },
      { items: ['cluster-policy-report'] },
      { items: ['ephemeral-report'] },
      { items: ['cluster-ephemeral-report'] },
    ]);

    expect(reports).toEqual([
      'policy-report',
      'cluster-policy-report',
      'ephemeral-report',
      'cluster-ephemeral-report',
    ]);
    expect(loading).toBe(false);
  });

  test('waits for source lists that are still loading', () => {
    const { reports, loading } = combineReportSources([
      { items: ['policy-report'] },
      { items: null },
    ]);

    expect(reports).toEqual(['policy-report']);
    expect(loading).toBe(true);
  });

  test('treats unavailable source lists as empty', () => {
    const { reports, loading } = combineReportSources([
      { items: ['policy-report'] },
      { items: null, error: new Error('not found') },
    ]);

    expect(reports).toEqual(['policy-report']);
    expect(loading).toBe(false);
  });
});
