import '@testing-library/jest-dom/vitest';
import { ApiProxy, K8s } from '@kinvolk/headlamp-plugin/lib';
import { lightTheme } from '@kinvolk/headlamp-plugin/lib/components/App/defaultAppThemes';
import { createMuiTheme } from '@kinvolk/headlamp-plugin/lib/lib/themes';
import store from '@kinvolk/headlamp-plugin/lib/redux/stores/store';
import { ThemeProvider } from '@mui/material/styles';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { getConfigStore } from '../../../util';
import { GenericMetricsChart } from './GenericMetricsChart';

vi.mock('@kinvolk/headlamp-plugin/lib', async importOriginal => {
  const actual = await importOriginal<typeof import('@kinvolk/headlamp-plugin/lib')>();
  return {
    ...actual,
    ApiProxy: { ...actual.ApiProxy, request: vi.fn() },
    K8s: { ...actual.K8s, useCluster: () => 'alpha' },
  };
});
vi.mock('@iconify/react', () => ({ Icon: () => null }));

const now = 1794614400;
const configStore = getConfigStore();

function revision(revision: number, timestamp: number) {
  return {
    metadata: {
      name: `web-${revision}`,
      uid: `web-${revision}`,
      namespace: 'apps',
      creationTimestamp: new Date(timestamp * 1000).toISOString(),
      ownerReferences: [{ uid: 'web', kind: 'Deployment' }],
      annotations: { 'deployment.kubernetes.io/revision': String(revision) },
    },
  };
}

let history: { items: ReturnType<typeof revision>[] } | Promise<object>;

function renderChart() {
  const resource = new K8s.ResourceClasses.Deployment(
    {
      ...K8s.ResourceClasses.Deployment.getBaseObject(),
      metadata: {
        name: 'web',
        namespace: 'apps',
        uid: 'web',
        resourceVersion: '1',
        creationTimestamp: '2026-11-13T18:00:00Z',
      },
    },
    'alpha'
  );
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={createMuiTheme(lightTheme)}>
          <GenericMetricsChart
            resource={resource}
            cpuQuery="cpu"
            memoryQuery="memory"
            networkRxQuery="receive"
            networkTxQuery="transmit"
            filesystemReadQuery="read"
            filesystemWriteQuery="write"
          />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
}

function metricRequests() {
  return vi.mocked(ApiProxy.request).mock.calls.filter(([url]) => url.includes('/query_range?'));
}

describe('workload chart revision overlays', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(now * 1000);
    vi.stubGlobal(
      'ResizeObserver',
      vi.fn((callback: (entries: { contentRect: DOMRect }[]) => void) => ({
        observe: () => callback([{ contentRect: new DOMRect(0, 0, 800, 400) }]),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      }))
    );
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, 800, 400)
    );
    vi.spyOn(SVGElement.prototype, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(100, 50, 20, 350)
    );
    configStore.set({
      alpha: {
        isMetricsEnabled: true,
        autoDetect: false,
        address: 'monitoring/prometheus:9090',
        defaultTimespan: '6h',
        defaultResolution: 'high',
      },
    });
    history = { items: [] };
    vi.mocked(ApiProxy.request).mockImplementation(async url => {
      if (url.includes('/replicasets?')) return history;
      const params = new URL(String(url), 'http://localhost').searchParams;
      return new Response(
        JSON.stringify({
          status: 'success',
          data: {
            result: [
              {
                metric: {},
                values: [
                  [Number(params.get('start')), '1'],
                  [Number(params.get('end')), '2'],
                ],
              },
            ],
          },
        }),
        { status: 200 }
      );
    });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([
    { metric: 'CPU', legend: 'cpu (cores)', queries: ['cpu'] },
    { metric: 'Memory', legend: 'memory', queries: ['memory'] },
    { metric: 'Network', legend: 'receive', queries: ['receive', 'transmit'] },
    { metric: 'Filesystem', legend: 'read', queries: ['read', 'write'] },
  ])(
    'renders markers on $metric without changing metric queries',
    async ({ metric, legend, queries }) => {
      history = { items: [revision(1, now - 86400), revision(2, now - 3600)] };
      renderChart();
      await screen.findByRole('group', { name: 'metric chooser' });
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: metric }));
      await waitFor(() => expect(document.querySelector('.recharts-surface')).not.toBeNull());
      await screen.findByText(legend, { exact: true });
      await act(async () => {
        await Promise.resolve();
      });
      await waitFor(() => expect(screen.getByText('r2')).toBeVisible());
      expect(screen.queryByText('r1')).not.toBeInTheDocument();
      for (const query of queries) {
        const request = metricRequests()
          .map(([url]) => new URL(url, 'http://localhost'))
          .reverse()
          .find(url => url.searchParams.get('query') === query);
        expect(request).toBeDefined();
        expect(request?.searchParams.get('start')).toBe(String(now - 21600));
        expect(request?.searchParams.get('end')).toBe(String(now));
        expect(request?.searchParams.get('step')).toBe('28');
      }
      expect(
        vi.mocked(ApiProxy.request).mock.calls.filter(([url]) => url.includes('/replicasets?'))
      ).toHaveLength(1);
      expect(screen.queryByText(/not rollout completion/)).not.toBeInTheDocument();
    }
  );

  it('includes exact time boundaries and excludes immediately adjacent markers', async () => {
    history = {
      items: [
        revision(1, now - 21600 - 0.001),
        revision(2, now - 21600),
        revision(3, now),
        revision(4, now + 0.001),
      ],
    };
    renderChart();
    expect(await screen.findByText('r2')).toBeVisible();
    expect(screen.getByText('r3')).toBeVisible();
    expect(screen.queryByText('r1')).not.toBeInTheDocument();
    expect(screen.queryByText('r4')).not.toBeInTheDocument();
  });

  it('updates visible markers when the time range changes', async () => {
    history = { items: [revision(1, now - 7200), revision(2, now - 600)] };
    renderChart();
    expect(await screen.findByText('r1')).toBeVisible();
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Timespan' }));
    fireEvent.click(await screen.findByRole('option', { name: '30 minutes' }));
    await waitFor(() => expect(screen.queryByText('r1')).not.toBeInTheDocument());
    expect(screen.getByText('r2')).toBeVisible();
  });

  it('shows loading and permission errors without disabling metrics', async () => {
    let rejectList: (error: Error) => void;
    history = new Promise((_resolve, reject) => {
      rejectList = reject;
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderChart();
    expect(
      await screen.findByRole('progressbar', { name: 'Loading revision markers...' })
    ).toBeVisible();
    await act(async () => rejectList!(new Error('Forbidden')));
    expect(await screen.findByText('Could not load revision markers: Forbidden')).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Timespan' })).toBeVisible();
    expect(screen.queryByText('No retained revisions are available.')).not.toBeInTheDocument();
  });

  it('shows a distinct empty-history message', async () => {
    renderChart();
    expect(await screen.findByText('No retained revisions are available.')).toBeVisible();
  });

  it.each(['line', 'label'] as const)(
    'shows revision details and the caveat when hovering the marker %s',
    async target => {
      history = { items: [revision(2, now - 3600)] };
      renderChart();
      const label = await screen.findByText('r2');
      const marker = screen.getByRole('img', { name: 'r2' });
      const line = marker.querySelector('line');
      if (!line) throw new Error('Missing marker line');
      expect(marker).toHaveAttribute('tabindex', '0');
      expect(screen.queryByText(/not rollout completion/)).not.toBeInTheDocument();
      fireEvent.mouseOver(target === 'line' ? line : label);
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Revision 2');
      expect(tooltip).toHaveTextContent('Created:');
      expect(tooltip).toHaveTextContent(
        'Markers show retained revision object creation times, not rollout completion.'
      );
    }
  );
});
