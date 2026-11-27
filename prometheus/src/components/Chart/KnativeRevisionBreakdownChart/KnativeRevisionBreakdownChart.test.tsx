// @vitest-environment jsdom
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { expect, it, vi } from 'vitest';
import { fetchMetrics } from '../../../request';
import { MetricsNamespaceContext } from '../MetricsNamespace';
import { KnativeRevisionBreakdownChart } from './KnativeRevisionBreakdownChart';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (text: string) => text }),
}));
vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({ Loader: () => null }));
vi.mock('../../../request', () => ({
  fetchMetrics: vi.fn().mockResolvedValue({ status: 'success', data: { result: [] } }),
}));
vi.mock('../../../util', () => ({
  getTimeRangeAndStepSize: () => ({ from: 1, to: 2, step: 1 }),
  createTickTimestampFormatter: () => () => '',
  dataProcessor: vi.fn(),
}));
vi.mock('../Chart/Chart', () => ({
  default: ({ plots }) => <div>{plots.map(plot => plot.name).join(',')}</div>,
}));

it('scopes revision discovery and refetches when the namespace setting changes', async () => {
  const chart = (
    <KnativeRevisionBreakdownChart
      refresh={false}
      prometheusPrefix="monitoring/services/proxy:8080"
      resolution="medium"
      subPath={null}
      timespan="1h"
      namespace="tenant-a"
      serviceName="service"
    />
  );
  const view = render(
    <MetricsNamespaceContext.Provider value="tenant-a">{chart}</MetricsNamespaceContext.Provider>
  );
  await waitFor(() =>
    expect(fetchMetrics).toHaveBeenLastCalledWith(
      expect.objectContaining({ namespace: 'tenant-a' })
    )
  );
  view.rerender(
    <MetricsNamespaceContext.Provider value="tenant-b">{chart}</MetricsNamespaceContext.Provider>
  );
  await waitFor(() =>
    expect(fetchMetrics).toHaveBeenLastCalledWith(
      expect.objectContaining({ namespace: 'tenant-b' })
    )
  );
  view.rerender(chart);
  await waitFor(() =>
    expect(fetchMetrics).toHaveBeenLastCalledWith(expect.objectContaining({ namespace: undefined }))
  );
  view.unmount();
});

it.each(['success', 'error'])(
  'ignores stale discovery %s after switching namespaces',
  async outcome => {
    let resolveOld: (value: object) => void;
    let rejectOld: (reason: Error) => void;
    vi.mocked(fetchMetrics).mockImplementationOnce(
      () =>
        new Promise((resolve, reject) => {
          resolveOld = resolve;
          rejectOld = reject;
        })
    );
    vi.mocked(fetchMetrics).mockResolvedValueOnce({
      status: 'success',
      data: { result: [{ metric: { revision_name: 'current-revision' } }] },
    });
    const chart = (
      <KnativeRevisionBreakdownChart
        refresh={false}
        prometheusPrefix="monitoring/services/proxy:8080"
        resolution="medium"
        subPath={null}
        timespan="1h"
        namespace="tenant-a"
        serviceName="service"
      />
    );
    const view = render(
      <MetricsNamespaceContext.Provider value="tenant-a">{chart}</MetricsNamespaceContext.Provider>
    );
    view.rerender(
      <MetricsNamespaceContext.Provider value="tenant-b">{chart}</MetricsNamespaceContext.Provider>
    );
    await screen.findByText('current-revision');
    await act(async () => {
      if (outcome === 'success') resolveOld({ status: 'success', data: { result: [] } });
      else rejectOld(new Error('old discovery failed'));
    });
    expect(screen.queryByText('current-revision')).not.toBeNull();
    view.unmount();
  }
);
