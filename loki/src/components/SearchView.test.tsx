import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { defaults } from '../api/loki';
import { HistoricalSearch } from './SearchView';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { clusterRequest: request },
  K8s: { useCluster: () => 'a' },
}));
beforeEach(() => {
  request.mockReset();
  localStorage.clear();
  localStorage.setItem(
    'headlamp.loki.datasources.v1',
    JSON.stringify({ a: { ...defaults, clusterValue: 'a' }, b: { ...defaults, clusterValue: 'b' } })
  );
});
it('unmounting a cluster aborts pending work and never displays its late results', async () => {
  let release!: (v: unknown) => void;
  request.mockImplementation(
    () =>
      new Promise(resolve => {
        release = resolve;
      })
  );
  const view = render(<HistoricalSearch key="a" cluster="a" />);
  fireEvent.change(screen.getByLabelText(/Exact namespace/), { target: { value: 'shop' } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
  const signal = request.mock.calls[0][1].signal;
  view.rerender(<HistoricalSearch key="b" cluster="b" />);
  expect(signal.aborted).toBe(true);
  await act(async () =>
    release({
      status: 'success',
      data: {
        resultType: 'streams',
        result: [{ stream: {}, values: [['1', 'OLD_CLUSTER_SECRET']] }],
      },
    })
  );
  expect(screen.queryByText('OLD_CLUSTER_SECRET')).toBeNull();
  expect(screen.getByText(/Cluster: b/)).toBeTruthy();
});
it('renders denial separately and makes one request for a submitted query', async () => {
  request.mockRejectedValue({ status: 403 });
  render(<HistoricalSearch cluster="a" />);
  fireEvent.change(screen.getByLabelText(/Exact namespace/), { target: { value: 'shop' } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  await screen.findByText(/Access denied/);
  expect(request).toHaveBeenCalledTimes(1);
});

it('renders a bounded prefix and loads older entries with one expanded request', async () => {
  request.mockImplementation(async path => {
    const limit = Number(new URLSearchParams(path.split('?')[1]).get('limit'));
    return {
      status: 'success',
      data: {
        resultType: 'streams',
        result: [
          {
            stream: { namespace: 'shop' },
            values: Array.from({ length: limit }, () => ['1760000000123456789', 'REPEATED']),
          },
        ],
      },
    };
  });
  render(<HistoricalSearch cluster="a" />);
  fireEvent.change(screen.getByLabelText(/Exact namespace/), { target: { value: 'shop' } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  await waitFor(() => expect(screen.getAllByText('REPEATED')).toHaveLength(200));
  fireEvent.click(screen.getByRole('button', { name: 'Load older logs' }));
  await waitFor(() => expect(screen.getAllByText('REPEATED')).toHaveLength(400));
  for (const count of [800, 1600, 2000]) {
    fireEvent.click(screen.getByRole('button', { name: 'Load older logs' }));
    await waitFor(() => expect(screen.getAllByText('REPEATED')).toHaveLength(count), {
      timeout: 10000,
    });
  }
  expect(screen.getByRole('button', { name: 'Load older logs' }).hasAttribute('disabled')).toBe(
    true
  );
  expect(request).toHaveBeenCalledTimes(5);
  expect(request.mock.calls[0][0]).toMatch(/^\/api\/v1\/namespaces\//);
  expect(request.mock.calls[0][1].cluster).toBe('a');
  expect(request.mock.calls[0][1].autoLogoutOnAuthError).toBe(false);
}, 20000);
