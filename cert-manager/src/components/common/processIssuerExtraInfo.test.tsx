import React from 'react';
import { processIssuerExtraInfo } from './processIssuerExtraInfo';
import { IssuerSpec } from '../../resources/common';

// Pass-through translation mock — returns the key unchanged
const t = (key: string) => key;
const namespace = 'default';

/**
 * Helper: extract the computed string values from a NameValueTable element's
 * `rows` prop without rendering it (avoids MUI theme dependency in tests).
 *
 * The function returns JSX like:
 *   <NameValueTable rows={[{ name: 'Skip TLS Verify', value: 'Yes' | 'No' | undefined }, ...]} />
 *
 * We walk the rows array and collect all leaf string values.
 */
function extractRowValues(element: React.ReactElement): Record<string, string | undefined> {
  const rows: Array<{ name: string; value?: unknown }> =
    (element.props as { rows?: Array<{ name: string; value?: unknown }> }).rows ?? [];
  const result: Record<string, string | undefined> = {};
  for (const row of rows) {
    if (typeof row.value === 'string' || row.value === undefined) {
      result[row.name] = row.value as string | undefined;
    }
    // recurse into nested NameValueTable elements
    if (React.isValidElement(row.value)) {
      const nested = extractRowValues(row.value as React.ReactElement);
      Object.assign(result, nested);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Empty spec
// ---------------------------------------------------------------------------
describe('processIssuerExtraInfo — empty spec', () => {
  it('returns an empty array when no issuer type is set', () => {
    const spec = {} as IssuerSpec;
    const rows = processIssuerExtraInfo(spec, namespace, t);
    expect(rows).toHaveLength(0);
  });

  it('returns an empty array when namespace is undefined', () => {
    const spec = {} as IssuerSpec;
    const rows = processIssuerExtraInfo(spec, undefined, t);
    expect(rows).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// ACME issuer
// ---------------------------------------------------------------------------
describe('processIssuerExtraInfo — ACME issuer', () => {
  const baseAcmeSpec: IssuerSpec = {
    acme: {
      server: 'https://acme-staging-v02.api.letsencrypt.org/directory',
      email: 'admin@example.com',
      privateKeySecretRef: { name: 'letsencrypt-staging-key' },
    },
  } as IssuerSpec;

  it('returns exactly one row for an ACME spec', () => {
    const rows = processIssuerExtraInfo(baseAcmeSpec, namespace, t);
    expect(rows).toHaveLength(1);
  });

  it('names the row "ACME"', () => {
    const rows = processIssuerExtraInfo(baseAcmeSpec, namespace, t);
    expect(rows[0].name).toBe('ACME');
  });

  it('provides a valid React element as the row value', () => {
    const rows = processIssuerExtraInfo(baseAcmeSpec, namespace, t);
    expect(React.isValidElement(rows[0].value)).toBe(true);
  });

  it('resolves skipTLSVerify: true → "Yes"', () => {
    const spec: IssuerSpec = {
      acme: { ...baseAcmeSpec.acme, skipTLSVerify: true },
    } as IssuerSpec;
    const rows = processIssuerExtraInfo(spec, namespace, t);
    const values = extractRowValues(rows[0].value as React.ReactElement);
    expect(values[t('Skip TLS Verify')]).toBe(t('Yes'));
  });

  it('resolves skipTLSVerify: false → "No"', () => {
    const spec: IssuerSpec = {
      acme: { ...baseAcmeSpec.acme, skipTLSVerify: false },
    } as IssuerSpec;
    const rows = processIssuerExtraInfo(spec, namespace, t);
    const values = extractRowValues(rows[0].value as React.ReactElement);
    expect(values[t('Skip TLS Verify')]).toBe(t('No'));
  });

  it('resolves skipTLSVerify: undefined → undefined (row hidden)', () => {
    const rows = processIssuerExtraInfo(baseAcmeSpec, namespace, t);
    const values = extractRowValues(rows[0].value as React.ReactElement);
    expect(values[t('Skip TLS Verify')]).toBeUndefined();
  });

  it('resolves disableAccountKeyGeneration: true → "Yes"', () => {
    const spec: IssuerSpec = {
      acme: { ...baseAcmeSpec.acme, disableAccountKeyGeneration: true },
    } as IssuerSpec;
    const rows = processIssuerExtraInfo(spec, namespace, t);
    const values = extractRowValues(rows[0].value as React.ReactElement);
    expect(values[t('Disable Account Key Generation')]).toBe(t('Yes'));
  });

  it('resolves enableDurationFeature: true → "Yes"', () => {
    const spec: IssuerSpec = {
      acme: { ...baseAcmeSpec.acme, enableDurationFeature: true },
    } as IssuerSpec;
    const rows = processIssuerExtraInfo(spec, namespace, t);
    const values = extractRowValues(rows[0].value as React.ReactElement);
    expect(values[t('Enable Duration Feature')]).toBe(t('Yes'));
  });

  it('renders without error when solvers array is provided', () => {
    const spec: IssuerSpec = {
      acme: {
        ...baseAcmeSpec.acme,
        solvers: [
          {
            http01: {
              ingress: { class: 'nginx' },
            },
          },
        ],
      },
    } as IssuerSpec;
    const rows = processIssuerExtraInfo(spec, namespace, t);
    expect(rows).toHaveLength(1);
    expect(React.isValidElement(rows[0].value)).toBe(true);
  });

  it('renders without error when externalAccountBinding is provided', () => {
    const spec: IssuerSpec = {
      acme: {
        ...baseAcmeSpec.acme,
        externalAccountBinding: {
          keyID: 'my-key-id',
          keyAlgorithm: 'HS256',
          keySecretRef: { name: 'eab-secret', key: 'key' },
        },
      },
    } as IssuerSpec;
    const rows = processIssuerExtraInfo(spec, namespace, t);
    expect(rows).toHaveLength(1);
    expect(React.isValidElement(rows[0].value)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CA issuer
// ---------------------------------------------------------------------------
describe('processIssuerExtraInfo — CA issuer', () => {
  const caSpec: IssuerSpec = {
    ca: {
      secretName: 'my-ca-secret',
    },
  } as IssuerSpec;

  it('returns exactly one row for a CA spec', () => {
    const rows = processIssuerExtraInfo(caSpec, namespace, t);
    expect(rows).toHaveLength(1);
  });

  it('names the row "CA"', () => {
    const rows = processIssuerExtraInfo(caSpec, namespace, t);
    expect(rows[0].name).toBe('CA');
  });

  it('provides a valid React element as the row value', () => {
    const rows = processIssuerExtraInfo(caSpec, namespace, t);
    expect(React.isValidElement(rows[0].value)).toBe(true);
  });

  it('renders without error when crlDistributionPoints is provided', () => {
    const spec: IssuerSpec = {
      ca: {
        secretName: 'my-ca-secret',
        crlDistributionPoints: ['http://crl.example.com/crl.pem'],
      },
    } as IssuerSpec;
    const rows = processIssuerExtraInfo(spec, namespace, t);
    expect(rows).toHaveLength(1);
    expect(React.isValidElement(rows[0].value)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Vault issuer
// ---------------------------------------------------------------------------
describe('processIssuerExtraInfo — Vault issuer', () => {
  const vaultSpec: IssuerSpec = {
    vault: {
      server: 'https://vault.example.com',
      path: 'pki/sign/my-role',
      auth: {
        tokenSecretRef: { name: 'vault-token', key: 'token' },
      },
    },
  } as IssuerSpec;

  it('returns exactly one row for a Vault spec', () => {
    const rows = processIssuerExtraInfo(vaultSpec, namespace, t);
    expect(rows).toHaveLength(1);
  });

  it('names the row "Vault"', () => {
    const rows = processIssuerExtraInfo(vaultSpec, namespace, t);
    expect(rows[0].name).toBe('Vault');
  });

  it('provides a valid React element as the row value', () => {
    const rows = processIssuerExtraInfo(vaultSpec, namespace, t);
    expect(React.isValidElement(rows[0].value)).toBe(true);
  });

  it('renders without error with appRole auth', () => {
    const spec: IssuerSpec = {
      vault: {
        server: 'https://vault.example.com',
        path: 'pki/sign/my-role',
        auth: {
          appRole: {
            path: 'approle',
            roleId: 'my-role-id',
            secretRef: { name: 'vault-approle-secret', key: 'roleSecretID' },
          },
        },
      },
    } as IssuerSpec;
    const rows = processIssuerExtraInfo(spec, namespace, t);
    expect(rows).toHaveLength(1);
    expect(React.isValidElement(rows[0].value)).toBe(true);
  });

  it('renders without error with kubernetes auth', () => {
    const spec: IssuerSpec = {
      vault: {
        server: 'https://vault.example.com',
        path: 'pki/sign/my-role',
        auth: {
          kubernetes: {
            role: 'my-app',
            secretRef: { name: 'vault-sa-secret', key: 'token' },
            mountPath: 'kubernetes',
          },
        },
      },
    } as IssuerSpec;
    const rows = processIssuerExtraInfo(spec, namespace, t);
    expect(rows).toHaveLength(1);
    expect(React.isValidElement(rows[0].value)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SelfSigned issuer
// ---------------------------------------------------------------------------
describe('processIssuerExtraInfo — SelfSigned issuer', () => {
  it('returns exactly one row for a selfSigned spec', () => {
    const spec: IssuerSpec = { selfSigned: {} } as IssuerSpec;
    const rows = processIssuerExtraInfo(spec, namespace, t);
    expect(rows).toHaveLength(1);
  });

  it('names the row "Self Signed"', () => {
    const spec: IssuerSpec = { selfSigned: {} } as IssuerSpec;
    const rows = processIssuerExtraInfo(spec, namespace, t);
    expect(rows[0].name).toBe('Self Signed');
  });

  it('provides a valid React element as the row value', () => {
    const spec: IssuerSpec = { selfSigned: {} } as IssuerSpec;
    const rows = processIssuerExtraInfo(spec, namespace, t);
    expect(React.isValidElement(rows[0].value)).toBe(true);
  });

  it('renders without error when crlDistributionPoints is provided', () => {
    const spec: IssuerSpec = {
      selfSigned: {
        crlDistributionPoints: ['http://crl.example.com/crl.pem'],
      },
    } as IssuerSpec;
    const rows = processIssuerExtraInfo(spec, namespace, t);
    expect(rows).toHaveLength(1);
    expect(React.isValidElement(rows[0].value)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Venafi issuer
// ---------------------------------------------------------------------------
describe('processIssuerExtraInfo — Venafi issuer', () => {
  const venafiTppSpec: IssuerSpec = {
    venafi: {
      zone: 'Cloud\\Example',
      tpp: {
        url: 'https://tpp.example.com/vedsdk',
        credentialsRef: { name: 'tpp-credentials' },
      },
    },
  } as IssuerSpec;

  it('returns exactly one row for a Venafi spec', () => {
    const rows = processIssuerExtraInfo(venafiTppSpec, namespace, t);
    expect(rows).toHaveLength(1);
  });

  it('names the row "Venafi"', () => {
    const rows = processIssuerExtraInfo(venafiTppSpec, namespace, t);
    expect(rows[0].name).toBe('Venafi');
  });

  it('provides a valid React element as the row value', () => {
    const rows = processIssuerExtraInfo(venafiTppSpec, namespace, t);
    expect(React.isValidElement(rows[0].value)).toBe(true);
  });

  it('renders without error with Venafi Cloud config', () => {
    const spec: IssuerSpec = {
      venafi: {
        zone: 'Cloud\\Example',
        cloud: {
          url: 'https://api.venafi.cloud/v1',
          apiTokenSecretRef: { name: 'venafi-cloud-token', key: 'apiKey' },
        },
      },
    } as IssuerSpec;
    const rows = processIssuerExtraInfo(spec, namespace, t);
    expect(rows).toHaveLength(1);
    expect(React.isValidElement(rows[0].value)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Multiple issuer types combined
// ---------------------------------------------------------------------------
describe('processIssuerExtraInfo — multiple issuer types', () => {
  it('returns two rows when both ACME and CA are set', () => {
    const spec: IssuerSpec = {
      acme: {
        server: 'https://acme.example.com',
        email: 'admin@example.com',
        privateKeySecretRef: { name: 'acme-key' },
      },
      ca: {
        secretName: 'my-ca-secret',
      },
    } as IssuerSpec;
    const rows = processIssuerExtraInfo(spec, namespace, t);
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe('ACME');
    expect(rows[1].name).toBe('CA');
  });

  it('preserves row order: ACME, CA, Vault, SelfSigned, Venafi', () => {
    const spec: IssuerSpec = {
      acme: {
        server: 'https://acme.example.com',
        email: 'admin@example.com',
        privateKeySecretRef: { name: 'acme-key' },
      },
      ca: { secretName: 'ca-secret' },
      vault: {
        server: 'https://vault.example.com',
        path: 'pki',
        auth: { tokenSecretRef: { name: 'vault-token', key: 'token' } },
      },
      selfSigned: {},
      venafi: {
        zone: 'zone',
        tpp: { url: 'https://tpp.example.com', credentialsRef: { name: 'cred' } },
      },
    } as IssuerSpec;
    const rows = processIssuerExtraInfo(spec, namespace, t);
    expect(rows).toHaveLength(5);
    expect(rows[0].name).toBe('ACME');
    expect(rows[1].name).toBe('CA');
    expect(rows[2].name).toBe('Vault');
    expect(rows[3].name).toBe('Self Signed');
    expect(rows[4].name).toBe('Venafi');
  });
});
