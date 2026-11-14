import '@testing-library/jest-dom/vitest';
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { lightTheme } from '@kinvolk/headlamp-plugin/lib/components/App/defaultAppThemes';
import { createMuiTheme } from '@kinvolk/headlamp-plugin/lib/lib/themes';
import store from '@kinvolk/headlamp-plugin/lib/redux/stores/store';
import { ThemeProvider } from '@mui/material/styles';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { getConfigStore } from '../../../util';
import { DiskMetricsChart } from './DiskMetricsChart';

const state = vi.hoisted(() => ({ cluster: 'alpha' }));

vi.mock('@kinvolk/headlamp-plugin/lib', async importOriginal => {
  const actual = await importOriginal<typeof import('@kinvolk/headlamp-plugin/lib')>();
  return {
    ...actual,
    ApiProxy: { ...actual.ApiProxy, request: vi.fn() },
    K8s: { ...actual.K8s, useCluster: () => state.cluster },
  };
});
vi.mock('@iconify/react', () => ({ Icon: () => null }));

const configStore = getConfigStore();
const defaultConfig = {
  alpha: {
    isMetricsEnabled: true,
    autoDetect: false,
    address: 'monitoring/prometheus:9090',
    subPath: '/metrics',
    defaultTimespan: '6h',
    defaultResolution: 'high',
  },
  beta: {
    isMetricsEnabled: true,
    autoDetect: false,
    address: 'other/prometheus:9090',
    defaultTimespan: '48h',
    defaultResolution: '30s',
  },
};

function renderChart() {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={createMuiTheme(lightTheme)}>
          <DiskMetricsChart usageQuery="disk_usage" capacityQuery="disk_capacity" />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
}

function requests() {
  return vi
    .mocked(ApiProxy.request)
    .mock.calls.map(([url]) => new URL(String(url), 'http://localhost'))
    .filter(url => url.pathname.endsWith('/query_range'));
}

async function selectOption(label: string, option: string) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: label }));
  fireEvent.click(await screen.findByRole('option', { name: option }));
}

async function expectQueryRange(seconds: number, step: number) {
  await waitFor(() => {
    for (const query of ['disk_usage', 'disk_capacity']) {
      const request = requests()
        .reverse()
        .find(url => url.searchParams.get('query') === query);
      expect(request).toBeDefined();
      expect(
        Number(request?.searchParams.get('end')) - Number(request?.searchParams.get('start'))
      ).toBe(seconds);
      expect(Number(request?.searchParams.get('step'))).toBe(step);
    }
  });
}

describe('DiskMetricsChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'ResizeObserver',
      vi.fn(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() }))
    );
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, 800, 320)
    );
    state.cluster = 'alpha';
    configStore.set(defaultConfig);
    vi.mocked(ApiProxy.request).mockImplementation(
      async () =>
        new Response(JSON.stringify({ status: 'success', data: { result: [] } }), {
          status: 200,
        })
    );
  });

  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
    });
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses cluster defaults and preserves queries and the configured sub-path', async () => {
    renderChart();
    expect(await screen.findByRole('combobox', { name: 'Timespan' })).toHaveTextContent('6 hours');
    expect(screen.getByRole('combobox', { name: 'Resolution' })).toHaveTextContent('High res.');
    await expectQueryRange(21600, 28);
    expect(requests()[0].pathname).toBe(
      '/api/v1/namespaces/monitoring/services/prometheus:9090/proxy/metrics/api/v1/query_range'
    );
  });

  it('changes the actual request window without modifying global defaults', async () => {
    renderChart();
    await screen.findByRole('combobox', { name: 'Timespan' });
    await selectOption('Timespan', '30 minutes');
    await expectQueryRange(1800, 2);
    expect(configStore.get()).toEqual(defaultConfig);
  });

  it('uses fixed and automatic resolution choices in actual requests', async () => {
    renderChart();
    await screen.findByRole('combobox', { name: 'Resolution' });
    await selectOption('Resolution', '10s');
    await expectQueryRange(21600, 10);
    await selectOption('Resolution', 'Low res.');
    await expectQueryRange(21600, 216);
  });

  it('supports calendar ranges', async () => {
    renderChart();
    await screen.findByRole('combobox', { name: 'Timespan' });
    await selectOption('Timespan', 'Yesterday');
    await expectQueryRange(86400, 115);
    expect(Number(requests().at(-1)?.searchParams.get('end')) % 86400).toBe(0);
  });

  it.each([
    ['Timespan', '30 minutes'],
    ['Resolution', '10s'],
  ])('ignores late responses after changing %s', async (control, option) => {
    let releaseOld: () => void;
    const oldRequest = new Promise<void>(resolve => {
      releaseOld = resolve;
    });
    vi.mocked(ApiProxy.request).mockImplementation(async path => {
      const params = new URL(String(path), 'http://localhost').searchParams;
      const from = Number(params.get('start'));
      const to = Number(params.get('end'));
      const oldSelection = to - from === 21600 && params.get('step') === '28';
      if (oldSelection) await oldRequest;
      return new Response(
        JSON.stringify({
          status: 'success',
          data: {
            result: oldSelection
              ? [
                  {
                    metric: {},
                    values: [
                      [from, '1073741824'],
                      [to, '2147483648'],
                    ],
                  },
                ]
              : [],
          },
        }),
        { status: 200 }
      );
    });
    renderChart();
    await screen.findByRole('combobox', { name: control });
    await waitFor(() =>
      expect(requests().some(url => url.searchParams.get('step') === '28')).toBe(true)
    );
    await selectOption(control, option);
    expect(await screen.findByText('No Data')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    await act(async () => releaseOld!());
    await waitFor(() =>
      expect(
        requests().some(
          url =>
            url.searchParams.get('step') === '28' &&
            url.searchParams.get('query') === 'disk_capacity'
        )
      ).toBe(true)
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText('No Data')).toBeVisible();
    expect(document.querySelector('.recharts-surface')).toBeNull();
    expect(screen.getByRole('combobox', { name: control })).toHaveTextContent(option);
  });

  it('pauses and resumes automatic requests', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    renderChart();
    await expectQueryRange(21600, 28);
    await screen.findByText('No Data');
    await act(async () => {
      await Promise.resolve();
    });
    vi.mocked(ApiProxy.request).mockClear();
    await act(async () => vi.advanceTimersByTimeAsync(10000));
    await expectQueryRange(21600, 28);
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    const pausedCount = requests().length;
    await act(async () => vi.advanceTimersByTimeAsync(20000));
    expect(requests()).toHaveLength(pausedCount);
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    await act(async () => vi.advanceTimersByTimeAsync(10000));
    expect(requests().length).toBeGreaterThan(pausedCount);
  });

  it('uses defaults that arrive after the initial render', async () => {
    configStore.set({});
    renderChart();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    act(() => configStore.set(defaultConfig));
    expect(await screen.findByRole('combobox', { name: 'Timespan' })).toHaveTextContent('6 hours');
    await expectQueryRange(21600, 28);
  });

  it('tracks default changes until a per-view value is selected', async () => {
    renderChart();
    await screen.findByRole('combobox', { name: 'Timespan' });
    act(() =>
      configStore.set({
        ...defaultConfig,
        alpha: { ...defaultConfig.alpha, defaultTimespan: '3h' },
      })
    );
    await expectQueryRange(10800, 14);
    await selectOption('Timespan', '30 minutes');
    await expectQueryRange(1800, 2);
    await screen.findByText('No Data');
    await act(async () => {
      await Promise.resolve();
    });
    vi.mocked(ApiProxy.request).mockClear();
    act(() =>
      configStore.set({
        ...defaultConfig,
        alpha: { ...defaultConfig.alpha, defaultTimespan: '12h' },
      })
    );
    expect(await screen.findByRole('combobox', { name: 'Timespan' })).toHaveTextContent(
      '30 minutes'
    );
    await expectQueryRange(1800, 2);
  });

  it('resets overrides and pause state when switching clusters', async () => {
    const { rerender } = renderChart();
    await screen.findByRole('combobox', { name: 'Timespan' });
    await selectOption('Timespan', '30 minutes');
    await selectOption('Resolution', '10s');
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    state.cluster = 'beta';
    rerender(
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={createMuiTheme(lightTheme)}>
            <DiskMetricsChart usageQuery="disk_usage" capacityQuery="disk_capacity" />
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    );
    expect(await screen.findByRole('combobox', { name: 'Timespan' })).toHaveTextContent('48 hours');
    expect(screen.getByRole('combobox', { name: 'Resolution' })).toHaveTextContent('30s');
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    await expectQueryRange(172800, 30);
    expect(requests().at(-1)?.pathname).toContain('/other/services/prometheus:9090/');
  });

  it('does not render controls or query when metrics are disabled', () => {
    configStore.set({ alpha: { isMetricsEnabled: false } });
    renderChart();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(ApiProxy.request).not.toHaveBeenCalled();
  });

  it('shows missing Prometheus without enabling controls', async () => {
    configStore.set({ alpha: { isMetricsEnabled: true } });
    renderChart();
    expect(await screen.findByText("Couldn't detect Prometheus in your cluster.")).toBeVisible();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('shows discovery failures instead of treating them as missing data', async () => {
    configStore.set({ alpha: { isMetricsEnabled: true, autoDetect: true } });
    vi.mocked(ApiProxy.request).mockRejectedValue(new Error('Forbidden'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderChart();
    expect(await screen.findByText('Error fetching prometheus Info')).toBeVisible();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(error).toHaveBeenCalledWith(
      'Error checking Prometheus installation:',
      expect.any(Error)
    );
  });

  it('keeps controls usable when a metrics query fails', async () => {
    vi.mocked(ApiProxy.request).mockImplementation(
      async () => new Response(null, { status: 503, statusText: 'Service Unavailable' })
    );
    renderChart();
    expect(await screen.findByText('Error: Service Unavailable')).toBeVisible();
    await selectOption('Timespan', '30 minutes');
    expect(screen.getByRole('combobox', { name: 'Timespan' })).toHaveTextContent('30 minutes');
  });
});
