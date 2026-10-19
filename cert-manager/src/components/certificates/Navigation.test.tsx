import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClusterIssuerDetail } from '../clusterIssuers/Detail';
import { SecretNameLink } from '../common/CommonComponents';
import { IssuerDetail } from '../issuers/Detail';
import { CertificateDetail } from './Detail';

const mocks = vi.hoisted(() => ({ item: {} as any }));
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  K8s: { ResourceClasses: { Secret: { kind: 'Secret' } } },
}));
vi.mock('react-i18next', () => ({ Trans: ({ children }: any) => children }));
vi.mock('react-router-dom', () => ({ useParams: () => ({}) }));
vi.mock('../../resources/certificate', () => ({ Certificate: {} }));
vi.mock('../../resources/clusterIssuer', () => ({ ClusterIssuer: {} }));
vi.mock('../../resources/issuer', () => ({ Issuer: {} }));
vi.mock('../../hooks/useCertManagerInstalled', () => ({
  useCertManagerInstalled: () => ({ isManagerInstalled: true, isCertManagerCheckLoading: false }),
}));
vi.mock('../../hooks/useClusterResourceNamespace', () => ({
  useClusterResourceNamespace: () => 'cm-secrets',
}));
vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  Link: ({ activeCluster, params, children }: any) => (
    <a href={`/${activeCluster}/${params.namespace}/${params.name}`}>{children}</a>
  ),
  NameValueTable: ({ rows }: any) => (
    <>
      {rows.map((row: any, index: number) => (
        <div key={index}>{row.value}</div>
      ))}
    </>
  ),
  SimpleTable: ({ data, columns }: any) => (
    <>
      {data.map((item: any, index: number) => (
        <div key={index}>
          {columns.map((column: any, j: number) => (
            <div key={j}>{column.getter(item)}</div>
          ))}
        </div>
      ))}
    </>
  ),
  DetailsGrid: ({ extraInfo }: any) => (
    <>
      {extraInfo(mocks.item).map((row: any, index: number) => (
        <div key={index}>{row.value}</div>
      ))}
    </>
  ),
}));
vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', async () =>
  vi.importMock<any>('@kinvolk/headlamp-plugin/lib/components/common')
);
afterEach(cleanup);

describe('resource navigation stays in the resource cluster', () => {
  it('uses the certificate cluster on the detail-page Secret link', () => {
    mocks.item = {
      metadata: { namespace: 'production' },
      cluster: 'cluster-b',
      spec: { secretName: 'web-tls' },
    };
    render(<CertificateDetail />);
    expect(screen.getByRole('link', { name: 'web-tls' }).getAttribute('href')).toBe(
      '/cluster-b/production/web-tls'
    );
  });
  it.each([
    ['Issuer', IssuerDetail, 'production'],
    ['ClusterIssuer', ClusterIssuerDetail, 'cm-secrets'],
  ] as const)(
    'propagates %s cluster identity through nested ACME and DNS Secret selectors',
    (_name, Component, namespace) => {
      mocks.item = {
        metadata: { namespace: 'production' },
        cluster: 'cluster-b',
        spec: {
          acme: {
            email: 'example@example.com',
            server: 'https://example.com',
            privateKeySecretRef: { name: 'account-key' },
            solvers: [
              {
                dns01: {
                  provider: 'cloudflare',
                  cloudflare: { apiTokenSecretRef: { name: 'dns-token', key: 'token' } },
                },
              },
            ],
          },
        },
      };
      render(<Component />);
      for (const name of ['account-key', 'dns-token'])
        expect(screen.getByRole('link', { name }).getAttribute('href')).toBe(
          `/cluster-b/${namespace}/${name}`
        );
    }
  );
  it('does not create a misleading link without a discovered namespace or name', () => {
    const view = render(<SecretNameLink name="account-key" cluster="cluster-b" />);
    expect(screen.getByText('account-key')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
    view.rerender(<SecretNameLink namespace="cm-secrets" cluster="cluster-b" />);
    expect(view.container.textContent).toBe('');
  });
});
