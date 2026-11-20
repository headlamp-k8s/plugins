import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

type Row = { name: string; value?: ReactNode; hide?: boolean };
type Column = { label: string; getter: (item: unknown) => ReactNode };

// The real Headlamp components load plugin translations, which can finish after the test
// environment is torn down and fail the run with "window is not defined".
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: { ResourceClasses: { Secret: { kind: 'Secret' } } },
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  DateLabel: () => null,
  LabelListItem: () => null,
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
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
  SectionBox: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  SimpleTable: ({ columns, data }: { columns: Column[]; data: unknown[] }) => (
    <table>
      <thead>
        <tr>
          {columns.map(column => (
            <th key={column.label}>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={index}>
            {columns.map(column => (
              <td key={column.label}>{column.getter(item)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

import { ACMEChallengeSolverComponent } from './CommonComponents';

describe('ACMEChallengeSolverComponent', () => {
  it('shows the fields of a Route53 DNS-01 solver', () => {
    const { container } = render(
      <ACMEChallengeSolverComponent
        namespace="cert-manager"
        solver={{
          dns01: {
            route53: {
              region: 'us-east-1',
              hostedZoneID: 'Z123EXAMPLE',
              secretAccessKeySecretRef: { name: 'route53-credentials', key: 'secret-access-key' },
            },
          },
        }}
      />
    );

    expect(container.textContent).not.toContain('[object Object]');
    expect(screen.getByText('Route53')).toBeTruthy();
    expect(screen.getByText('Region')).toBeTruthy();
    expect(screen.getByText('us-east-1')).toBeTruthy();
    expect(screen.getByText('Hosted Zone ID')).toBeTruthy();
    expect(screen.getByText('Z123EXAMPLE')).toBeTruthy();
    // Secret key references are shown with their Secret name and key.
    expect(screen.getByText('route53-credentials')).toBeTruthy();
    expect(screen.getByText('secret-access-key')).toBeTruthy();
  });

  it('shows nested webhook solver config', () => {
    const { container } = render(
      <ACMEChallengeSolverComponent
        solver={{
          dns01: {
            webhook: {
              groupName: 'acme.example.com',
              solverName: 'example',
              config: { apiUrl: 'https://dns.example.com', zones: ['example.com', 'example.org'] },
            },
          },
        }}
      />
    );

    expect(container.textContent).not.toContain('[object Object]');
    expect(screen.getByText('acme.example.com')).toBeTruthy();
    expect(screen.getByText('https://dns.example.com')).toBeTruthy();
    expect(screen.getByText('example.org')).toBeTruthy();
  });

  it('shows webhook config keys that match built-in object property names', () => {
    // Parsed like the JSON from the API, so "__proto__" is an own key.
    const config = JSON.parse(
      '{"__proto__": "proto-value", "constructor": "ctor-value", "toString": "tostring-value"}'
    );
    const { container } = render(
      <ACMEChallengeSolverComponent
        solver={{ dns01: { webhook: { groupName: 'acme.example.com', config } } }}
      />
    );

    expect(container.textContent).not.toContain('[object Object]');
    expect(screen.getByText('__proto__')).toBeTruthy();
    expect(screen.getByText('proto-value')).toBeTruthy();
    expect(screen.getByText('Constructor')).toBeTruthy();
    expect(screen.getByText('ctor-value')).toBeTruthy();
    expect(screen.getByText('To String')).toBeTruthy();
    expect(screen.getByText('tostring-value')).toBeTruthy();
  });

  it('keeps the Cloudflare labels', () => {
    render(
      <ACMEChallengeSolverComponent
        solver={{
          dns01: {
            cloudflare: {
              email: 'admin@example.com',
              apiTokenSecretRef: { name: 'cloudflare-token', key: 'api-token' },
            },
          },
        }}
      />
    );

    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText('admin@example.com')).toBeTruthy();
    expect(screen.getByText('API Token Secret')).toBeTruthy();
    expect(screen.getByText('cloudflare-token')).toBeTruthy();
  });

  it('shows an HTTP-01 solver that uses a Gateway API HTTPRoute', () => {
    const { container } = render(
      <ACMEChallengeSolverComponent
        solver={{
          http01: {
            gatewayHTTPRoute: {
              parentRefs: [{ name: 'main-gw', namespace: 'default', kind: 'Gateway' }],
            },
          },
        }}
      />
    );

    expect(container.textContent).not.toContain('[object Object]');
    expect(screen.getByText('Parent Refs')).toBeTruthy();
    expect(screen.getByText('main-gw')).toBeTruthy();
    expect(screen.getByText('Gateway')).toBeTruthy();
  });

  it('still shows HTTP-01 Ingress solver fields', () => {
    render(
      <ACMEChallengeSolverComponent
        solver={{
          http01: {
            ingress: {
              ingressClassName: 'nginx',
              podTemplate: { spec: { nodeSelector: { 'kubernetes.io/os': 'linux' } } },
            },
          },
        }}
      />
    );

    expect(screen.getByText('Ingress Class Name')).toBeTruthy();
    expect(screen.getByText('nginx')).toBeTruthy();
    expect(screen.getByText('{"kubernetes.io/os":"linux"}')).toBeTruthy();
  });
});
