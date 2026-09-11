import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: { ResourceClasses: { Namespace: class Namespace {} } },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  SectionBox: ({ title, children }: any) => <div data-testid={`section-${title}`}>{children}</div>,
  StatusLabel: ({ children }: any) => <span>{children}</span>,
}));

import NamespaceEnrollment from './NamespaceEnrollment';

afterEach(cleanup);

function namespace(labels: Record<string, string> = {}) {
  return { kind: 'Namespace', metadata: { labels } };
}

describe('NamespaceEnrollment', () => {
  it('renders nothing for a non-Namespace resource', () => {
    const { container } = render(<NamespaceEnrollment resource={{ kind: 'Pod' } as any} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when there is no resource at all', () => {
    const { container } = render(<NamespaceEnrollment resource={null as any} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows "Not Enrolled" and no waypoint when the namespace has no relevant labels', () => {
    render(<NamespaceEnrollment resource={namespace() as any} />);
    expect(screen.getByText('Not Enrolled')).toBeTruthy();
    expect(screen.getByText('None assigned')).toBeTruthy();
  });

  it('shows "Kmesh" enrollment and the waypoint name when both labels are set', () => {
    render(
      <NamespaceEnrollment
        resource={
          namespace({
            'istio.io/dataplane-mode': 'Kmesh',
            'istio.io/use-waypoint': 'my-waypoint',
          }) as any
        }
      />
    );
    expect(screen.getByText('Kmesh')).toBeTruthy();
    expect(screen.getByText('my-waypoint')).toBeTruthy();
  });

  it('is not enrolled if the dataplane-mode label has an unexpected value', () => {
    render(
      <NamespaceEnrollment resource={namespace({ 'istio.io/dataplane-mode': 'Istio' }) as any} />
    );
    expect(screen.getByText('Not Enrolled')).toBeTruthy();
  });
});
