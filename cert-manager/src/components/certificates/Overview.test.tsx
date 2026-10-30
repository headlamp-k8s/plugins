import { configureStore } from '@reduxjs/toolkit';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Certificate } from '../../resources/certificate';
import { CertificateExpiryLabel } from './CertificateExpiryLabel';
import {
  CertificatesOverview,
  CertificatesOverviewPage,
  CertificatesOverviewProps,
} from './Overview';

const mocks = vi.hoisted(() => ({
  useList: vi.fn(),
  installed: true as boolean | null,
  t: (key: string, options?: { count?: number }) =>
    key.replace('{{count}}', String(options?.count)),
}));
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: mocks.t }),
  K8s: { ResourceClasses: { Secret: { kind: 'Secret' } } },
}));
vi.mock('react-i18next', () => ({ Trans: ({ children }: any) => children }));
vi.mock('../../resources/certificate', () => ({
  Certificate: { useList: mocks.useList, detailsRoute: 'certificate' },
}));
vi.mock('../../hooks/useCertManagerInstalled', () => ({
  useCertManagerInstalled: () => ({
    isManagerInstalled: mocks.installed,
    isCertManagerCheckLoading: mocks.installed === null,
  }),
}));
vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  Link: ({ activeCluster, params, children }: any) => (
    <a href={`/${activeCluster}/${params.namespace}/${params.name}`}>{children}</a>
  ),
  SectionBox: ({ title, children }: any) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
  SectionFilterHeader: () => <div>Namespace filter</div>,
  StatusLabel: ({ status, sx, children }: any) => (
    <span data-status={status} data-background={sx?.backgroundColor}>
      {children}
    </span>
  ),
  SimpleTable: ({ columns, data, emptyMessage }: any) => (
    <div>
      {data.length
        ? data.map((item: any) => (
            <div key={item.metadata.name}>
              {columns.map((column: any) => (
                <span key={column.label}>{column.getter(item)}</span>
              ))}
            </div>
          ))
        : emptyMessage}
    </div>
  ),
}));

function certificate(name: string, remainingMs: number) {
  return {
    metadata: { name, namespace: 'production' },
    cluster: 'cluster-b',
    status: { notAfter: new Date(Date.now() + remainingMs).toISOString() },
  } as Certificate;
}
function props(certificates: Certificate[]): CertificatesOverviewProps {
  return {
    certificates,
    certificatesError: null,
    isManagerInstalled: true,
    isCertManagerCheckLoading: false,
  };
}
function summary(name: string, count: number) {
  expect(within(screen.getByRole('group', { name })).getByText(String(count))).toBeTruthy();
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime('2030-01-01T12:00:00Z');
  mocks.installed = true;
  mocks.useList.mockReset();
  mocks.useList.mockReturnValue([[], null]);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('certificate overview and expiry clock', () => {
  it('exposes the exact expiration timestamp through keyboard focus', () => {
    const notAfter = '2030-01-08T12:00:00Z';
    render(<CertificateExpiryLabel notAfter={notAfter} />);
    const trigger = screen.getByText('7 days').parentElement!;
    expect(trigger.tabIndex).toBe(0);
    act(() => {
      trigger.focus();
      fireEvent.focus(trigger);
      vi.advanceTimersByTime(100);
    });
    expect(document.activeElement).toBe(trigger);
    expect(screen.getByRole('tooltip').textContent).toBe(notAfter);
  });
  it('moves an unchanged certificate into attention when it crosses 30 days', () => {
    const certificates = [certificate('boundary', 30 * 864e5 + 1000)];
    render(<CertificatesOverview {...props(certificates)} />);
    summary('Expiring soon', 0);
    act(() => vi.advanceTimersByTime(30_000));
    summary('Expiring soon', 1);
    expect(screen.getByRole('link', { name: 'boundary' }).getAttribute('href')).toBe(
      '/cluster-b/production/boundary'
    );
  });
  it('updates expired counts and row labels together without a data update', () => {
    const certificates = [certificate('boundary', 1000)];
    render(<CertificatesOverview {...props(certificates)} />);
    summary('Expired', 0);
    act(() => vi.advanceTimersByTime(30_000));
    summary('Expired', 1);
    expect(
      screen.getByText('Expired', { selector: '[data-status]' }).getAttribute('data-background')
    ).toBe('common.black');
  });
  it('refreshes a standalone detail label across the seven-day and expiry boundaries', () => {
    const item = certificate('boundary', 7 * 864e5 + 1000);
    const view = render(<CertificateExpiryLabel notAfter={item.status.notAfter} />);
    expect(screen.getByText('7 days').getAttribute('data-status')).toBe('warning');
    act(() => vi.advanceTimersByTime(30_000));
    expect(screen.getByText('6 days').getAttribute('data-status')).toBe('error');
    vi.setSystemTime(Date.parse(item.status.notAfter!) + 1);
    act(() => window.dispatchEvent(new Event('focus')));
    expect(screen.getByText('Expired').getAttribute('data-background')).toBe('common.black');
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('passes selected namespaces to the production query and reacts to changes', () => {
    const store = configureStore({
      reducer: (state = { filter: { namespaces: new Set(['production']) } }, action) =>
        action.type === 'select'
          ? { filter: { namespaces: new Set(action.payload as string[]) } }
          : state,
      middleware: getDefault => getDefault({ serializableCheck: false }),
    });
    render(
      <Provider store={store}>
        <CertificatesOverviewPage />
      </Provider>
    );
    expect(mocks.useList).toHaveBeenLastCalledWith({ namespace: ['production'] });
    expect(screen.getByText('Namespace filter')).toBeTruthy();
    act(() => {
      store.dispatch({ type: 'select', payload: ['security'] });
    });
    expect(mocks.useList).toHaveBeenLastCalledWith({ namespace: ['security'] });
    act(() => {
      store.dispatch({ type: 'select', payload: [] });
    });
    expect(mocks.useList).toHaveBeenLastCalledWith({ namespace: undefined });
  });
  it('shows loading and API errors rather than zero-count summaries', () => {
    const view = render(<CertificatesOverview {...props([])} certificates={null} />);
    expect(screen.getByText('Loading certificates')).toBeTruthy();
    view.rerender(
      <CertificatesOverview
        {...props([])}
        certificates={null}
        certificatesError={new Error('Forbidden') as any}
      />
    );
    expect(screen.getByRole('alert').textContent).toBe('Failed to load certificates');
    expect(screen.queryByRole('group')).toBeNull();
  });
  it.each([null, false])('defers overview queries when installation is %s', installed => {
    mocks.installed = installed;
    render(<CertificatesOverviewPage />);
    expect(mocks.useList).not.toHaveBeenCalled();
  });
});
