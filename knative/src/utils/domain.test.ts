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

import { vi } from 'vitest';

const post = vi.fn();

vi.mock('../resources/knative', () => ({
  ClusterDomainClaim: {
    kind: 'ClusterDomainClaim',
    apiVersion: 'networking.internal.knative.dev/v1alpha1',
    apiEndpoint: { post: (...args: unknown[]) => post(...args) },
  },
  KnativeDomainMapping: {
    kind: 'DomainMapping',
    apiVersion: 'serving.knative.dev/v1beta1',
    apiEndpoint: { post: (...args: unknown[]) => post(...args) },
  },
}));

import { createClusterDomainClaim } from './domain';

/** Minimal DomainMapping stand-in with the fields createClusterDomainClaim touches. */
function makeDomainMapping(overrides: Partial<{ host: string; cluster: string }> = {}) {
  return {
    host: 'example.com',
    cluster: 'my-cluster',
    patch: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

describe('createClusterDomainClaim', () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({});
  });

  it('rejects a DomainMapping with no host', async () => {
    const dm = makeDomainMapping({ host: '' });
    await expect(createClusterDomainClaim(dm as never, 'default')).rejects.toThrow(
      'Domain name is missing'
    );
    expect(post).not.toHaveBeenCalled();
  });

  it('creates the claim and annotates the DomainMapping on the happy path', async () => {
    const dm = makeDomainMapping();
    await expect(createClusterDomainClaim(dm as never, 'default')).resolves.toBeUndefined();

    expect(post).toHaveBeenCalledTimes(1);
    expect(dm.patch).toHaveBeenCalledTimes(1);
    const patchArg = dm.patch.mock.calls[0][0] as {
      metadata: { annotations: Record<string, string> };
    };
    expect(patchArg.metadata.annotations).toHaveProperty('knative.headlamp.dev/reconciledAt');
  });

  it('reports a claim-creation failure as a ClusterDomainClaim error', async () => {
    post.mockRejectedValue(new Error('forbidden'));
    const dm = makeDomainMapping();

    await expect(createClusterDomainClaim(dm as never, 'default')).rejects.toThrow(
      'Failed to create ClusterDomainClaim: forbidden'
    );
  });

  // Regression: the claim POST succeeds and only the follow-up annotation patch fails.
  // The surfaced message must describe the annotation step, not claim creation, because
  // the ClusterDomainClaim does exist by this point and telling the user it failed to be
  // created sends them to debug the wrong resource.
  it('reports an annotation failure without blaming ClusterDomainClaim creation', async () => {
    const dm = makeDomainMapping();
    dm.patch = vi.fn().mockRejectedValue(new Error('patch conflict'));

    await expect(createClusterDomainClaim(dm as never, 'default')).rejects.toThrow(
      'Failed to annotate DomainMapping: patch conflict'
    );

    // The claim itself was created, so the error must not claim otherwise.
    expect(post).toHaveBeenCalledTimes(1);
    await expect(createClusterDomainClaim(dm as never, 'default')).rejects.not.toThrow(
      /Failed to create ClusterDomainClaim/
    );
  });

  it('treats an already-existing claim as success and still annotates', async () => {
    post.mockRejectedValue(new Error('clusterdomainclaims "example.com" already exists'));
    const dm = makeDomainMapping();

    await expect(createClusterDomainClaim(dm as never, 'default')).resolves.toBeUndefined();
    expect(dm.patch).toHaveBeenCalledTimes(1);
  });
});
