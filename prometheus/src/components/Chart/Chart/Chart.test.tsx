// @vitest-environment jsdom
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { expect, it, vi } from 'vitest';
import { MetricsNamespaceContext } from '../MetricsNamespace';
import Chart from './Chart';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (s: string, values?: { error: string }) => values?.error ?? s }),
}));
vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  EmptyContent: ({ children }) => <div>{children}</div>,
  Loader: () => null,
}));
vi.mock('../../../util', () => ({ getTimeRangeAndStepSize: () => ({ from: 1, to: 2, step: 1 }) }));
vi.mock('recharts', () => ({ ResponsiveContainer: ({ children }) => <div>{children}</div> }));

it('passes the resource namespace and refetches when it changes', async () => {
  const fetchMetrics = vi.fn().mockResolvedValue({ status: 'success', data: { result: [] } });
  const props = {
    plots: [{ query: 'up', name: 'up', fillColor: '', strokeColor: '', dataProcessor: () => [] }],
    interval: '1h',
    resolution: 'medium',
    prometheusPrefix: 'monitoring/services/proxy:8080',
    autoRefresh: false,
    xAxisProps: {},
    yAxisProps: {},
    fetchMetrics,
  };
  const view = render(
    <MetricsNamespaceContext.Provider value="tenant-a">
      <Chart {...props} />
    </MetricsNamespaceContext.Provider>
  );
  await waitFor(() =>
    expect(fetchMetrics).toHaveBeenLastCalledWith(
      expect.objectContaining({ namespace: 'tenant-a' })
    )
  );
  view.rerender(
    <MetricsNamespaceContext.Provider value="tenant-b">
      <Chart {...props} />
    </MetricsNamespaceContext.Provider>
  );
  await waitFor(() =>
    expect(fetchMetrics).toHaveBeenLastCalledWith(
      expect.objectContaining({ namespace: 'tenant-b' })
    )
  );
  view.rerender(<Chart {...props} />);
  await waitFor(() =>
    expect(fetchMetrics).toHaveBeenLastCalledWith(expect.objectContaining({ namespace: undefined }))
  );
  view.unmount();
});

it.each(['success', 'error'])(
  'ignores stale metrics %s after a namespace change',
  async outcome => {
    let resolveOld: (value: object) => void;
    let rejectOld: (reason: Error) => void;
    const fetchMetrics = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve, reject) => {
            resolveOld = resolve;
            rejectOld = reject;
          })
      )
      .mockRejectedValueOnce(new Error('current failure'));
    const chart = (
      <Chart
        plots={[
          { query: 'up', name: 'up', fillColor: '', strokeColor: '', dataProcessor: () => [] },
        ]}
        interval="1h"
        resolution="medium"
        prometheusPrefix="monitoring/services/proxy:8080"
        autoRefresh={false}
        xAxisProps={{}}
        yAxisProps={{}}
        fetchMetrics={fetchMetrics}
      />
    );
    const view = render(
      <MetricsNamespaceContext.Provider value="tenant-a">{chart}</MetricsNamespaceContext.Provider>
    );
    view.rerender(
      <MetricsNamespaceContext.Provider value="tenant-b">{chart}</MetricsNamespaceContext.Provider>
    );
    await screen.findByText('current failure');
    await act(async () => {
      if (outcome === 'success') resolveOld({ status: 'success', data: { result: [] } });
      else rejectOld(new Error('old failure'));
    });
    expect(screen.queryByText('current failure')).not.toBeNull();
    view.unmount();
  }
);
