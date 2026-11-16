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

function enterAbsoluteRange(start: string, end: string) {
  fireEvent.change(screen.getByLabelText(/Exact namespace/), { target: { value: 'shop' } });
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Time range' }));
  fireEvent.click(screen.getByRole('option', { name: 'Absolute range (UTC)' }));
  fireEvent.change(screen.getByLabelText('Start (ISO 8601 with timezone)'), {
    target: { value: start },
  });
  fireEvent.change(screen.getByLabelText('End (ISO 8601 with timezone)'), {
    target: { value: end },
  });
}

it.each([
  ['2026-02-30T10:00:00Z', '2026-03-02T11:00:00Z'],
  ['2026-03-02T09:00:00Z', '2026-02-30T11:00:00Z'],
])('rejects invalid calendar dates before querying (%s to %s)', async (start, end) => {
  request.mockResolvedValue({ status: 'success', data: { resultType: 'streams', result: [] } });
  render(<HistoricalSearch cluster="a" />);
  enterAbsoluteRange(start, end);
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  await screen.findByText(/valid ISO 8601 timestamp/);
  expect(request).not.toHaveBeenCalled();
});

it('queries valid leap-day timestamps with timezone offsets without changing the instant', async () => {
  request.mockResolvedValue({ status: 'success', data: { resultType: 'streams', result: [] } });
  render(<HistoricalSearch cluster="a" />);
  enterAbsoluteRange('2024-02-29T23:30:00-05:00', '2024-03-01T05:30:00Z');
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  await screen.findByText(/No matching retained logs/);
  expect(request).toHaveBeenCalledTimes(1);
  const params = new URLSearchParams(request.mock.calls[0][0].split('?')[1]);
  expect(params.get('start')).toBe(
    String(BigInt(Date.parse('2024-03-01T04:30:00Z')) * BigInt(1000000))
  );
  expect(params.get('end')).toBe(
    String(BigInt(Date.parse('2024-03-01T05:30:00Z')) * BigInt(1000000))
  );
});

it.each([
  ['2026-03-01T10:00:00.123400Z', '2026-03-01T10:00:00.123900Z'],
  ['2026-03-01T10:00:00.123Z', '2026-03-01T11:00:00.123900Z'],
])('rejects sub-millisecond bounds before querying (%s to %s)', async (start, end) => {
  request.mockResolvedValue({ status: 'success', data: { resultType: 'streams', result: [] } });
  render(<HistoricalSearch cluster="a" />);
  enterAbsoluteRange(start, end);
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  await screen.findByText(
    'Absolute timestamps support at most three fractional digits (milliseconds).'
  );
  expect(request).not.toHaveBeenCalled();
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
