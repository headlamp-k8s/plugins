import { describe, expect, it } from 'vitest';
import { instanceApiInfoFromCrdSpec, matchesGeneratedCrd } from './instanceApi';

const genAiServiceCrdSpec = {
  group: 'kro.run',
  scope: 'Namespaced',
  names: { kind: 'GenAIService', plural: 'genaiservices' },
  versions: [
    { name: 'v1alpha1', storage: false },
    { name: 'v1alpha2', storage: true },
  ],
};

describe('matchesGeneratedCrd', () => {
  it('matches on group and generated kind', () => {
    expect(matchesGeneratedCrd(genAiServiceCrdSpec, 'kro.run', 'GenAIService')).toBe(true);
    expect(matchesGeneratedCrd(genAiServiceCrdSpec, 'kro.run', 'FineTuneModel')).toBe(false);
    expect(matchesGeneratedCrd(genAiServiceCrdSpec, 'other.dev', 'GenAIService')).toBe(false);
    expect(matchesGeneratedCrd(undefined, 'kro.run', 'GenAIService')).toBe(false);
  });
});

describe('instanceApiInfoFromCrdSpec', () => {
  it('reads plural, scope, and the storage version from the CRD', () => {
    expect(instanceApiInfoFromCrdSpec(genAiServiceCrdSpec)).toEqual({
      group: 'kro.run',
      version: 'v1alpha2',
      plural: 'genaiservices',
      kind: 'GenAIService',
      isNamespaced: true,
    });
  });

  it('falls back to the first version when none is marked storage', () => {
    const info = instanceApiInfoFromCrdSpec({
      ...genAiServiceCrdSpec,
      versions: [{ name: 'v1alpha1' }],
    });
    expect(info?.version).toBe('v1alpha1');
  });

  it('treats non-Namespaced scopes as cluster-scoped', () => {
    const info = instanceApiInfoFromCrdSpec({ ...genAiServiceCrdSpec, scope: 'Cluster' });
    expect(info?.isNamespaced).toBe(false);
  });

  it('returns null on partial specs', () => {
    expect(instanceApiInfoFromCrdSpec(undefined)).toBeNull();
    expect(instanceApiInfoFromCrdSpec({ group: 'kro.run' })).toBeNull();
    expect(instanceApiInfoFromCrdSpec({ ...genAiServiceCrdSpec, versions: [] })).toBeNull();
  });
});
