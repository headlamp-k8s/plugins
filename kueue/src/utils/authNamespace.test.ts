import { describe, expect, it } from 'vitest';
import { resolveAuthNamespace } from './authNamespace';

const namespaced = { isNamespaced: true };
const clusterScoped = { isNamespaced: false };

describe('resolveAuthNamespace', () => {
  it('scopes the check to the namespace for a namespaced resource', () => {
    expect(resolveAuthNamespace(namespaced, 'data-sci')).toBe('data-sci');
  });

  it('leaves the check cluster-wide when a namespaced resource has no namespace yet', () => {
    expect(resolveAuthNamespace(namespaced)).toBeUndefined();
    expect(resolveAuthNamespace(namespaced, '')).toBeUndefined();
  });

  it('ignores a namespace passed for a cluster-scoped resource', () => {
    // Narrowing a cluster-wide check would ask whether the user holds the verb in one
    // namespace, which is not what the caller means for a cluster-scoped resource.
    expect(resolveAuthNamespace(clusterScoped, 'data-sci')).toBeUndefined();
  });

  it('returns undefined for a cluster-scoped resource with no namespace', () => {
    expect(resolveAuthNamespace(clusterScoped)).toBeUndefined();
  });
});
