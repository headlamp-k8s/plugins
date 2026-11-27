import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { IssuerSpec } from '../../resources/common';
import { processIssuerExtraInfo } from './processIssuerExtraInfo';

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    NameValueTable: ({
      rows,
    }: {
      rows: { name: string; value?: React.ReactNode; hide?: boolean }[];
    }) => (
      <dl>
        {rows
          .filter(row => !row.hide)
          .map(row => (
            <div key={row.name}>
              <dt>{row.name}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
      </dl>
    ),
    Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  };
});

// The real component loads plugin translations, which can finish after the test
// environment is torn down and fail the run with "window is not defined".
vi.mock('./CommonComponents', async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    // Reads selector.name like the real component, so a missing selector still throws.
    SecretKeySelectorComponent: ({ selector }: { selector: { name: string } }) => (
      <span>{selector.name}</span>
    ),
  };
});

const t = (key: string) => key;

function renderVaultInfo(spec: IssuerSpec) {
  const rows = processIssuerExtraInfo(spec, 'default', t);
  expect(rows).toHaveLength(1);
  return render(<>{rows[0].value}</>);
}

describe('processIssuerExtraInfo: Vault Kubernetes auth', () => {
  it('renders when auth uses serviceAccountRef and has no secretRef', () => {
    renderVaultInfo({
      vault: {
        server: 'https://vault.example.com:8200',
        path: 'pki/sign/example',
        auth: {
          kubernetes: {
            role: 'cert-manager',
            mountPath: '/v1/auth/kubernetes',
            serviceAccountRef: { name: 'vault-issuer' },
          },
        },
      },
    });

    expect(screen.getByText('cert-manager')).toBeTruthy();
    expect(screen.getByText('/v1/auth/kubernetes')).toBeTruthy();
    expect(screen.getByText('Service Account')).toBeTruthy();
    expect(screen.getByText('vault-issuer')).toBeTruthy();
    expect(screen.queryByText('Secret Ref')).toBeNull();
  });

  it('still shows the secret name when secretRef is set', () => {
    renderVaultInfo({
      vault: {
        server: 'https://vault.example.com:8200',
        path: 'pki/sign/example',
        auth: {
          kubernetes: {
            role: 'cert-manager',
            secretRef: { name: 'vault-token', key: 'token' },
          },
        },
      },
    });

    expect(screen.getByText('Secret Ref')).toBeTruthy();
    expect(screen.getByText('vault-token')).toBeTruthy();
    expect(screen.queryByText('Service Account')).toBeNull();
  });
});
