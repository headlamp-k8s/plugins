/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import store from '@kinvolk/headlamp-plugin/lib/redux/stores/store';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { getConfigStore } from '../../../util';
import { KnativeEventingQueueChart } from '../KnativeEventingChart/KnativeEventingChart';
import { VolcanoChart } from './VolcanoChart';

vi.mock('@kinvolk/headlamp-plugin/lib', async importOriginal => {
  const actual = await importOriginal<typeof import('@kinvolk/headlamp-plugin/lib')>();
  return {
    ...actual,
    ApiProxy: { ...actual.ApiProxy, request: vi.fn() },
    K8s: { ...actual.K8s, useCluster: () => 'alpha' },
  };
});
vi.mock('../GenericMetricsChart/GenericMetricsChart', () => ({ CustomToggleButton: () => null }));

const configStore = getConfigStore();

/**
 * Renders the chart switcher with a queue chart, for cluster `beta` while the current cluster is
 * `alpha`.
 *
 * @returns The rendered chart switcher.
 */
function renderBetaCharts() {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <VolcanoChart
          cluster="beta"
          chartConfigs={[
            {
              key: 'queue',
              label: 'Queued events',
              icon: 'mdi:tray-full',
              queries: { queuedQuery: 'lag' },
              component: KnativeEventingQueueChart,
            },
          ]}
        />
      </BrowserRouter>
    </Provider>
  );
}

describe('VolcanoChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'ResizeObserver',
      vi.fn(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() }))
    );
    vi.mocked(ApiProxy.request).mockImplementation(async (url: string) =>
      url.includes('/query_range')
        ? new Response(JSON.stringify({ status: 'success', data: { result: [] } }), {
            status: 200,
          })
        : { kind: url.includes('/pods') ? 'PodList' : 'ServiceList', items: [] }
    );
  });

  test('queries the Prometheus of the cluster it is given', async () => {
    configStore.set({
      alpha: { isMetricsEnabled: true, autoDetect: false, address: 'alpha/prometheus:9090' },
      beta: { isMetricsEnabled: true, autoDetect: false, address: 'beta/prometheus:9090' },
    });

    renderBetaCharts();

    await waitFor(() => expect(ApiProxy.request).toHaveBeenCalled());
    for (const [url, params] of vi.mocked(ApiProxy.request).mock.calls) {
      expect(url).toMatch(/^\/api\/v1\/namespaces\/beta\/services\/prometheus:9090\/proxy\//);
      expect(params).toMatchObject({ cluster: 'beta' });
    }
  });

  test('shows nothing while metrics are off for the cluster it is given', async () => {
    configStore.set({
      alpha: { isMetricsEnabled: true, autoDetect: false, address: 'alpha/prometheus:9090' },
      beta: { isMetricsEnabled: false },
    });

    const { container } = renderBetaCharts();
    await act(async () => {
      await Promise.resolve();
    });

    expect(container.innerHTML).toBe('');
    expect(ApiProxy.request).not.toHaveBeenCalled();
  });

  test('searches its cluster for Prometheus, and turns metrics off there on Dismiss', async () => {
    configStore.set({
      alpha: { isMetricsEnabled: true, autoDetect: true },
      beta: { isMetricsEnabled: true, autoDetect: true },
    });

    renderBetaCharts();
    fireEvent.click(await screen.findByRole('button', { name: 'Dismiss' }));

    expect(ApiProxy.request).toHaveBeenCalled();
    for (const [, params] of vi.mocked(ApiProxy.request).mock.calls) {
      expect(params).toMatchObject({ cluster: 'beta' });
    }
    expect(configStore.get()).toMatchObject({
      alpha: { isMetricsEnabled: true },
      beta: { isMetricsEnabled: false },
    });
  });
});
