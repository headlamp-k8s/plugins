import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CertificateExpiryLabel } from './CertificateExpiryLabel';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (!params) return key;
      return Object.entries(params).reduce((acc, [k, v]) => acc.replace(`{{${k}}}`, v), key);
    },
  }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  StatusLabel: ({ status, children }: { status: string; children: React.ReactNode }) => (
    <span data-testid="status-label" data-status={status}>
      {children}
    </span>
  ),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/Utils', () => ({
  localeDate: (date: string) => `formatted-${date}`,
  formatDuration: (diffMs: number) => {
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return `${days}d`;
  },
}));

describe('CertificateExpiryLabel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a dash when notAfter is empty or invalid', () => {
    const { container: emptyContainer } = render(<CertificateExpiryLabel notAfter="" />);
    expect(emptyContainer.textContent).toBe('-');

    const { container: nullContainer } = render(<CertificateExpiryLabel notAfter={null} />);
    expect(nullContainer.textContent).toBe('-');

    const { container: invalidContainer } = render(
      <CertificateExpiryLabel notAfter="invalid-date" />
    );
    expect(invalidContainer.textContent).toBe('-');
  });

  it('renders compact label and status color for valid dates', () => {
    const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
    render(<CertificateExpiryLabel notAfter={futureDate} />);

    const label = screen.getByTestId('status-label');
    expect(label.getAttribute('data-status')).toBe('warning');
    expect(label.textContent).toBe('15d');
    expect(label.parentElement?.getAttribute('tabindex')).toBe('0');
  });

  it('renders with remaining suffix when showRemainingSuffix is true', () => {
    const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    render(<CertificateExpiryLabel notAfter={futureDate} showRemainingSuffix />);

    const label = screen.getByTestId('status-label');
    expect(label.getAttribute('data-status')).toBe('success');
    expect(label.textContent).toBe('60d remaining');
  });

  it('renders Expired status for past dates', () => {
    const pastDate = new Date(Date.now() - 1000).toISOString();
    render(<CertificateExpiryLabel notAfter={pastDate} showRemainingSuffix />);

    const label = screen.getByTestId('status-label');
    expect(label.getAttribute('data-status')).toBe('error');
    expect(label.textContent).toBe('Expired');
  });

  it('re-evaluates expiry status on timer tick without manual re-render', () => {
    // 5 seconds before expiring
    const soonExpiring = new Date(Date.now() + 5000).toISOString();
    render(<CertificateExpiryLabel notAfter={soonExpiring} />);

    let label = screen.getByTestId('status-label');
    expect(label.getAttribute('data-status')).toBe('error');
    expect(label.textContent).toBe('0d');

    // Advance timer past expiration and past the 10s interval
    act(() => {
      vi.advanceTimersByTime(11_000);
    });

    label = screen.getByTestId('status-label');
    expect(label.getAttribute('data-status')).toBe('error');
    expect(label.textContent).toBe('Expired');
  });
});
