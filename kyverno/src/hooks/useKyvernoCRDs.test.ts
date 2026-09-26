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

import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { probeCluster } from './useKyvernoCRDs';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: {
    request: vi.fn(),
  },
}));

function mockApiGroups(available: string[]) {
  vi.mocked(ApiProxy.request).mockImplementation((path: string) => {
    if (available.includes(path)) {
      return Promise.resolve({});
    }
    return Promise.reject(new Error('not found'));
  });
}

describe('probeCluster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects cleanup/exceptions/v2 reports when kyverno.io/v2 is present, even without legacy v1', async () => {
    // A CEL-only Kyverno install: clusterpolicies/policies (v1) disabled,
    // but cleanuppolicies/policyexceptions (v2) still enabled — a supported
    // configuration per Kyverno's own Helm chart CRD toggles.
    mockApiGroups(['/apis/policies.kyverno.io/v1', '/apis/kyverno.io/v2']);
    const status = await probeCluster('cel-only-cluster');

    expect(status.legacy).toBe(false);
    expect(status.cel).toBe(true);
    expect(status.cleanup).toBe(true);
    expect(status.exceptions).toBe(true);
    expect(status.kyvernoV2Reports).toBe(true);
  });

  it('reports everything false when no API group is installed', async () => {
    mockApiGroups([]);
    const status = await probeCluster('no-kyverno-cluster');

    expect(status.legacy).toBe(false);
    expect(status.cel).toBe(false);
    expect(status.cleanup).toBe(false);
    expect(status.exceptions).toBe(false);
    expect(status.kyvernoV2Reports).toBe(false);
    expect(status.reports).toBe(false);
    expect(status.ephemeralReports).toBe(false);
  });

  it('detects a stock install with both legacy and v2 present', async () => {
    mockApiGroups([
      '/apis/kyverno.io/v1',
      '/apis/wgpolicyk8s.io/v1alpha2',
      '/apis/reports.kyverno.io/v1',
      '/apis/kyverno.io/v2',
    ]);
    const status = await probeCluster('stock-cluster');

    expect(status.legacy).toBe(true);
    expect(status.reports).toBe(true);
    expect(status.ephemeralReports).toBe(true);
    expect(status.cleanup).toBe(true);
    expect(status.exceptions).toBe(true);
    expect(status.kyvernoV2Reports).toBe(true);
  });
});
