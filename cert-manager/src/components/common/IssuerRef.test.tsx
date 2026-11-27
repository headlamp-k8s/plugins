import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

type Row = { name: string; value?: ReactNode; hide?: boolean };

// The real Headlamp components load plugin translations, which can finish after the test
// environment is torn down and fail the run with "window is not defined".
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: { ResourceClasses: {} },
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  DateLabel: () => null,
  LabelListItem: () => null,
  Link: ({
    children,
    routeName,
    params,
  }: {
    children: ReactNode;
    routeName: string;
    params: Record<string, string>;
  }) => (
    <span data-route={routeName} data-params={JSON.stringify(params)}>
      {children}
    </span>
  ),
  NameValueTable: ({ rows }: { rows: Row[] }) => (
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
  NameValueTableRow: () => null,
  SectionBox: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  SimpleTable: () => null,
}));

import { IssuerRef } from './CommonComponents';

describe('IssuerRef', () => {
  it('links a cert-manager Issuer to its page in the resource namespace', () => {
    render(
      <IssuerRef
        issuerRef={{ name: 'letsencrypt', kind: 'Issuer', group: 'cert-manager.io' }}
        namespace="edge"
      />
    );
    const link = screen.getByText('letsencrypt').closest('[data-route]');
    expect(link?.getAttribute('data-route')).toBe('/cert-manager/issuers/:namespace/:name');
    expect(JSON.parse(link?.getAttribute('data-params') ?? '{}')).toEqual({
      name: 'letsencrypt',
      namespace: 'edge',
    });
  });

  it('links an issuerRef without kind or group to the Issuer page', () => {
    render(<IssuerRef issuerRef={{ name: 'my-issuer' }} namespace="edge" />);
    const link = screen.getByText('my-issuer').closest('[data-route]');
    expect(link?.getAttribute('data-route')).toBe('/cert-manager/issuers/:namespace/:name');
    expect(screen.queryByText('Group')).toBeNull();
  });

  it('links a cert-manager ClusterIssuer to the ClusterIssuer page', () => {
    render(
      <IssuerRef
        issuerRef={{ name: 'corp-ca', kind: 'ClusterIssuer', group: 'cert-manager.io' }}
        namespace="edge"
      />
    );
    const link = screen.getByText('corp-ca').closest('[data-route]');
    expect(link?.getAttribute('data-route')).toBe('/cert-manager/clusterissuers/:name');
    expect(JSON.parse(link?.getAttribute('data-params') ?? '{}')).toEqual({ name: 'corp-ca' });
  });

  it('links a ClusterIssuer without a group to the ClusterIssuer page', () => {
    render(<IssuerRef issuerRef={{ name: 'corp-ca', kind: 'ClusterIssuer' }} namespace="edge" />);
    const link = screen.getByText('corp-ca').closest('[data-route]');
    expect(link?.getAttribute('data-route')).toBe('/cert-manager/clusterissuers/:name');
    expect(JSON.parse(link?.getAttribute('data-params') ?? '{}')).toEqual({ name: 'corp-ca' });
    expect(screen.queryByText('Group')).toBeNull();
  });

  it('shows an external issuer as plain text with its group', () => {
    render(
      <IssuerRef
        issuerRef={{
          name: 'corp-ca',
          kind: 'GoogleCASClusterIssuer',
          group: 'cas-issuer.jetstack.io',
        }}
        namespace="edge"
      />
    );
    expect(screen.getByText('corp-ca').closest('[data-route]')).toBeNull();
    expect(screen.getByText('GoogleCASClusterIssuer')).toBeTruthy();
    expect(screen.getByText('Group')).toBeTruthy();
    expect(screen.getByText('cas-issuer.jetstack.io')).toBeTruthy();
  });

  it('does not link a cert-manager kind it has no page for', () => {
    render(
      <IssuerRef
        issuerRef={{ name: 'other', kind: 'SomethingElse', group: 'cert-manager.io' }}
        namespace="edge"
      />
    );
    expect(screen.getByText('other').closest('[data-route]')).toBeNull();
  });
});
