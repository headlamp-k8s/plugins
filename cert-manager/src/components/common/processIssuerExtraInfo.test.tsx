import { describe, expect, it } from 'vitest';
import { IssuerSpec } from '../../resources/common';
import { processIssuerExtraInfo } from './processIssuerExtraInfo';

describe('processIssuerExtraInfo', () => {
  const dummyIdentityTranslate = (key: string) => key;

  it('returns empty array when spec has no issuers defined', () => {
    const spec: IssuerSpec = {};
    const result = processIssuerExtraInfo(spec, 'default', dummyIdentityTranslate);
    expect(result).toEqual([]);
  });

  it('processes ACME issuer configuration correctly', () => {
    const spec: IssuerSpec = {
      acme: {
        email: 'user@example.com',
        server: 'https://acme-v02.api.letsencrypt.org/directory',
        skipTLSVerify: true,
        privateKeySecretRef: {
          name: 'letsencrypt-key',
          key: 'tls.key',
        },
      },
    };

    const result = processIssuerExtraInfo(spec, 'default', dummyIdentityTranslate);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('ACME');
    expect(result[0].value).toBeDefined();
  });

  it('processes CA issuer configuration correctly', () => {
    const spec: IssuerSpec = {
      ca: {
        secretName: 'ca-key-pair',
        crlDistributionPoints: ['http://example.com/crl.pem'],
      },
    };

    const result = processIssuerExtraInfo(spec, 'cert-manager', dummyIdentityTranslate);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('CA');
    expect(result[0].value).toBeDefined();
  });

  it('processes Vault issuer configuration correctly', () => {
    const spec: IssuerSpec = {
      vault: {
        server: 'https://vault.example.com',
        path: 'secret/data/cert',
        auth: {
          tokenSecretRef: {
            name: 'vault-token',
            key: 'token',
          },
        },
      },
    };

    const result = processIssuerExtraInfo(spec, 'default', dummyIdentityTranslate);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Vault');
    expect(result[0].value).toBeDefined();
  });

  it('processes SelfSigned issuer configuration correctly', () => {
    const spec: IssuerSpec = {
      selfSigned: {
        crlDistributionPoints: ['http://example.com/crl.pem'],
      },
    };

    const result = processIssuerExtraInfo(spec, 'default', dummyIdentityTranslate);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Self Signed');
    expect(result[0].value).toBeDefined();
  });

  it('processes Venafi issuer configuration correctly', () => {
    const spec: IssuerSpec = {
      venafi: {
        zone: 'Venafi\\Zone',
        tpp: {
          url: 'https://tpp.example.com/vedsdk',
          credentialsRef: {
            name: 'tpp-secret',
            key: 'username',
          },
        },
      },
    };

    const result = processIssuerExtraInfo(spec, 'default', dummyIdentityTranslate);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Venafi');
    expect(result[0].value).toBeDefined();
  });
});
