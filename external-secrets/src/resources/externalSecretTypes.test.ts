import { describe, expect, it } from 'vitest';
import {
  ExternalSecretSpec,
  getStoreKind,
  getStoreName,
  getTargetSecretName,
} from './externalSecretTypes';

describe('getTargetSecretName', () => {
  it('uses spec.target.name when set', () => {
    const spec: ExternalSecretSpec = { target: { name: 'custom-secret' } };
    expect(getTargetSecretName(spec, 'db-credentials')).toBe('custom-secret');
  });

  it('defaults to the resource name when spec.target.name is not set', () => {
    expect(getTargetSecretName({}, 'db-credentials')).toBe('db-credentials');
    expect(getTargetSecretName({ target: {} }, 'db-credentials')).toBe('db-credentials');
    expect(getTargetSecretName(undefined, 'db-credentials')).toBe('db-credentials');
  });
});

describe('getStoreName and getStoreKind', () => {
  it('returns the referenced store', () => {
    const spec: ExternalSecretSpec = {
      secretStoreRef: { name: 'vault-backend', kind: 'ClusterSecretStore' },
    };
    expect(getStoreName(spec)).toBe('vault-backend');
    expect(getStoreKind(spec)).toBe('ClusterSecretStore');
  });

  it('defaults the kind to SecretStore and the name to a dash', () => {
    expect(getStoreKind({ secretStoreRef: { name: 'vault-backend' } })).toBe('SecretStore');
    expect(getStoreName({})).toBe('-');
    expect(getStoreName(undefined)).toBe('-');
    expect(getStoreKind(undefined)).toBe('SecretStore');
  });
});
