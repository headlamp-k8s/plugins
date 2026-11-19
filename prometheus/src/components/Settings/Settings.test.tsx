// @vitest-environment jsdom
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Settings } from './Settings';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { request: vi.fn() },
  K8s: { useClustersConf: () => ({ test: {} }) },
  useTranslation: () => ({ t: (text: string) => text }),
}));
vi.mock('./DiscoveryIntrospectionDialog', () => ({ DiscoveryIntrospectionDialog: () => null }));
vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  NameValueTable: ({ rows }) => (
    <div>
      {rows.map(row => (
        <div key={row.name}>{row.value}</div>
      ))}
    </div>
  ),
}));

function Configuration({ enabled = false }) {
  const [data, setData] = useState<React.ComponentProps<typeof Settings>['data']>({
    test: {
      isMetricsEnabled: true,
      autoDetect: false,
      address: 'monitoring/proxy:8080',
      namespaceQueryParam: enabled,
    },
  });
  return <Settings data={data} onDataChange={setData} />;
}

afterEach(cleanup);
beforeEach(() => {
  vi.mocked(ApiProxy.request).mockReset();
  vi.mocked(ApiProxy.request).mockResolvedValue({ status: 'success' });
});

describe('namespace-scoped connection test', () => {
  it('keeps existing configurations unscoped', async () => {
    render(<Configuration />);
    fireEvent.click(screen.getByRole('button', { name: 'Test Connection' }));
    await waitFor(() => expect(ApiProxy.request).toHaveBeenCalledOnce());
    const url = new URL(vi.mocked(ApiProxy.request).mock.calls[0][0], 'http://localhost');
    expect(url.searchParams.has('namespace')).toBe(false);
  });

  it('requires a test namespace only after enabling scoped queries', async () => {
    render(<Configuration />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Send resource namespace' }));
    const button = screen.getByRole('button', { name: 'Test Connection' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Namespace for connection test'), {
      target: { value: 'tenant-a' },
    });
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    await waitFor(() => expect(ApiProxy.request).toHaveBeenCalledOnce());
    const url = new URL(vi.mocked(ApiProxy.request).mock.calls[0][0], 'http://localhost');
    expect(url.pathname).toContain('/namespaces/monitoring/');
    expect(url.searchParams.get('namespace')).toBe('tenant-a');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Send resource namespace' }));
    expect(screen.queryByLabelText('Namespace for connection test')).toBeNull();
  });
});

it.each(['success', 'error'])(
  'ignores a stale %s after changing the test namespace',
  async outcome => {
    let resolveRequest: (value: unknown) => void;
    let rejectRequest: (reason: Error) => void;
    vi.mocked(ApiProxy.request).mockImplementationOnce(
      () =>
        new Promise((resolve, reject) => {
          resolveRequest = resolve;
          rejectRequest = reject;
        })
    );
    const view = render(<Configuration enabled />);
    fireEvent.change(screen.getByLabelText('Namespace for connection test'), {
      target: { value: 'tenant-a' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Test Connection' }));
    fireEvent.change(screen.getByLabelText('Namespace for connection test'), {
      target: { value: 'tenant-b' },
    });
    await act(async () => {
      if (outcome === 'success') resolveRequest({ status: 'success' });
      else rejectRequest(new Error('old request failed'));
    });
    expect(screen.queryByRole('alert')).toBeNull();
    view.unmount();
  }
);

it('keeps the newer test result when an older request fails after scoping changes', async () => {
  let rejectRequest: (reason: Error) => void;
  vi.mocked(ApiProxy.request).mockImplementationOnce(
    () =>
      new Promise((_, reject) => {
        rejectRequest = reject;
      })
  );
  vi.mocked(ApiProxy.request).mockResolvedValueOnce({ status: 'success' });
  const view = render(<Configuration enabled />);
  fireEvent.change(screen.getByLabelText('Namespace for connection test'), {
    target: { value: 'tenant-a' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Test Connection' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Send resource namespace' }));
  fireEvent.click(screen.getByRole('button', { name: 'Test Connection' }));
  await screen.findByText('Connection successful!');
  await act(async () => rejectRequest(new Error('old request failed')));
  expect(screen.getByRole('alert').textContent).toBe('Connection successful!');
  view.unmount();
});
