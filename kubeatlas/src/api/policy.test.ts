/*
 * Copyright 2026 The KubeAtlas Authors
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

import { beforeEach, describe, expect, it, vi } from 'vitest';

const request = vi.fn();
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { request: (...args: unknown[]) => request(...args) },
}));

import { fetchConstraintAffected, fetchPolicyConstraints } from './client';

const svc = { namespace: 'kubeatlas', name: 'kubeatlas', port: 8080 };
const proxy = '/api/v1/namespaces/kubeatlas/services/kubeatlas:8080/proxy';

describe('fetchPolicyConstraints', () => {
  beforeEach(() => request.mockReset());

  it('requests the constraints endpoint through the service proxy', async () => {
    request.mockResolvedValue([
      { name: 'all', kind: 'K8sRequiredLabels', engine: 'gatekeeper', violations: 1 },
    ]);
    const out = await fetchPolicyConstraints(svc);
    expect(request).toHaveBeenCalledWith(`${proxy}/api/v1/policy/constraints`, { isJSON: true });
    expect(out).toHaveLength(1);
  });

  it('passes the engine filter on the path', async () => {
    request.mockResolvedValue([]);
    await fetchPolicyConstraints(svc, 'kyverno');
    expect(request).toHaveBeenCalledWith(`${proxy}/api/v1/policy/constraints?engine=kyverno`, {
      isJSON: true,
    });
  });

  it('returns an empty array for a non-array response', async () => {
    request.mockResolvedValue(null);
    expect(await fetchPolicyConstraints(svc)).toEqual([]);
  });
});

describe('fetchConstraintAffected', () => {
  beforeEach(() => request.mockReset());

  it('requests the affected endpoint for the named constraint', async () => {
    request.mockResolvedValue({ constraint: 'all', resources: [], count: 0 });
    const out = await fetchConstraintAffected(svc, 'all');
    expect(request).toHaveBeenCalledWith(`${proxy}/api/v1/policy/constraints/all/affected`, {
      isJSON: true,
    });
    expect(out.constraint).toBe('all');
  });
});
