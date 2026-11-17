import '@testing-library/jest-dom/vitest';
import { ApiProxy, ConfigStore, K8s } from '@kinvolk/headlamp-plugin/lib';
import { lightTheme } from '@kinvolk/headlamp-plugin/lib/components/App/defaultAppThemes';
import { createMuiTheme } from '@kinvolk/headlamp-plugin/lib/lib/themes';
import store from '@kinvolk/headlamp-plugin/lib/redux/stores/store';
import { ThemeProvider } from '@mui/material/styles';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { getConfigStore } from '../../../util';
import { GenericMetricsChart } from './GenericMetricsChart';

const environment = vi.hoisted(() => ({ cluster: 'alpha' }));

vi.mock('@kinvolk/headlamp-plugin/lib', async importOriginal => {
  const actual = await importOriginal<typeof import('@kinvolk/headlamp-plugin/lib')>();
  return {
    ...actual,
    ApiProxy: { ...actual.ApiProxy, request: vi.fn() },
    K8s: { ...actual.K8s, useCluster: () => environment.cluster },
  };
});
vi.mock('@iconify/react', () => ({ Icon: () => null }));

const now = 1794614400;
const configStore = getConfigStore();
const warningPreferences = new ConfigStore<Record<string, boolean>>('prometheus:revisionWarnings');

function revision(revision: number, timestamp: number) {
  const annotations: Record<string, string> = {
    'deployment.kubernetes.io/revision': String(revision),
  };
  return {
    metadata: {
      name: `web-${revision}`,
      uid: `web-${revision}`,
      namespace: 'apps',
      creationTimestamp: new Date(timestamp * 1000).toISOString(),
      ownerReferences: [{ uid: 'web', kind: 'Deployment' }],
      annotations,
    },
  };
}

let history: { items: ReturnType<typeof revision>[] } | Promise<object> | Error;

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
    environment.cluster
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

function revisionLines() {
  return [
    ...document.querySelectorAll(
      '.recharts-reference-line line[stroke]:not([stroke="transparent"])'
    ),
  ];
}

function overflowDetails(element: HTMLElement) {
  Object.defineProperties(element, {
    clientHeight: { configurable: true, value: 200 },
    scrollHeight: { configurable: true, value: 1000 },
  });
}

describe('workload chart revision overlays', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    environment.cluster = 'alpha';
    warningPreferences.set({});
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
      if (url.includes('/replicasets?')) {
        if (history instanceof Error) throw history;
        return history;
      }
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
    const raw =
      'Forbidden - replicasets.apps is forbidden: User "test-user" cannot list resource "replicasets" in namespace "apps"';
    await act(async () => rejectList!(Object.assign(new Error(raw), { status: 403 })));
    expect(
      await screen.findByText(
        'Revision markers unavailable: permission to list workload revision history is required.'
      )
    ).toBeVisible();
    const details = screen.getByText(raw);
    expect(details).not.toBeVisible();
    const user = userEvent.setup();
    await user.click(screen.getByText('Technical details'));
    expect(details).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Timespan' })).toBeVisible();
    expect(screen.queryByText('No retained revisions are available.')).not.toBeInTheDocument();
  });

  it('keeps non-permission diagnostics collapsed behind a concise warning', async () => {
    history = new Error('Invalid Kubernetes revision list response.');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderChart();
    expect(await screen.findByText('Could not load revision markers.')).toBeVisible();
    expect(screen.getByText('Invalid Kubernetes revision list response.')).not.toBeVisible();
    const user = userEvent.setup();
    const summary = screen.getByText('Technical details');
    await user.click(summary);
    expect(screen.getByText('Invalid Kubernetes revision list response.')).toBeVisible();
  });

  it('lets users minimize a warning per cluster and reopen it after navigating', async () => {
    vi.spyOn(Date, 'now').mockRestore();
    const user = userEvent.setup();
    const raw = 'Forbidden - cannot list ReplicaSets';
    history = Object.assign(new Error(raw), { status: 403 });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const first = renderChart();
    await user.click(
      await screen.findByRole('button', { name: 'Minimize revision marker warning' })
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    const icon = screen.getByRole('button', { name: 'Show revision marker warning' });
    expect(icon).toHaveFocus();
    expect(document.getElementById(icon.getAttribute('aria-controls')!)).not.toBeVisible();
    await waitFor(() => {
      expect(
        JSON.parse(localStorage.getItem('pluginConfigs') ?? '{}')['prometheus:revisionWarnings']
          ?.alpha
      ).toBe(true);
    });
    first.unmount();
    renderChart();
    const reopenedIcon = await screen.findByRole('button', {
      name: 'Show revision marker warning',
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    act(() => reopenedIcon.focus());
    await user.keyboard('{Enter}');
    expect(screen.getByRole('alert')).toBeVisible();
    const summary = screen.getByText('Technical details');
    expect(summary).toHaveFocus();
    await user.click(summary);
    expect(screen.getByText(raw)).toBeVisible();
    expect(configStore.get().alpha.autoDetect).toBe(false);
  });

  it('does not apply a minimized preference to a different cluster', async () => {
    const user = userEvent.setup();
    history = Object.assign(new Error('Forbidden'), { status: 403 });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const first = renderChart();
    await user.click(
      await screen.findByRole('button', { name: 'Minimize revision marker warning' })
    );
    first.unmount();
    environment.cluster = 'beta';
    const config = configStore.get();
    act(() => configStore.set({ ...config, beta: config.alpha }));
    renderChart();
    expect(await screen.findByRole('alert')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Show revision marker warning' })
    ).not.toBeInTheDocument();
    expect(warningPreferences.get()).toEqual({ alpha: true });
  });

  it('shows a distinct empty-history message', async () => {
    renderChart();
    expect(await screen.findByText('No retained revisions are available.')).toBeVisible();
  });

  it('navigates to the owned ReplicaSet from its tooltip', async () => {
    history = { items: [revision(2, now - 3600)] };
    renderChart();
    fireEvent.mouseOver(await screen.findByText('r2'));
    const link = await screen.findByRole('link', { name: 'web-2' });
    expect(link).toHaveAttribute('href', '/c/alpha/replicasets/apps/web-2');
    fireEvent.click(link);
    expect(window.location.pathname).toBe('/c/alpha/replicasets/apps/web-2');
    window.history.replaceState({}, '', '/');
  });

  it.each([true, false])(
    'distinguishes current revision labels from creation times when retained rollback history is %s',
    async retained => {
      const createdAt = now - 7200;
      const old = revision(3, createdAt);
      if (retained) old.metadata.annotations['deployment.kubernetes.io/revision-history'] = '1';
      history = { items: [old, revision(2, now - 600)] };
      renderChart();
      const label = retained ? 'r3 (reused)' : 'r3 (possible reuse)';
      const marker = await screen.findByRole('button', { name: label });
      expect(screen.getAllByRole('button', { name: /^r\d/ })).toHaveLength(2);
      fireEvent.click(marker);
      const dialog = await screen.findByRole('dialog', { name: label });
      expect(dialog).toHaveTextContent('Current revision: r3');
      expect(dialog).toHaveTextContent(
        new Date(createdAt * 1000).toLocaleString(undefined, { timeZoneName: 'short' })
      );
      if (retained) {
        expect(dialog).toHaveTextContent('Previously served revisions (retained): r1');
        expect(dialog).toHaveTextContent(
          'This object was reused; the reuse or rollback time is unavailable.'
        );
      } else {
        expect(dialog).not.toHaveTextContent('Previously served revisions');
        expect(dialog).toHaveTextContent(
          'Possible reuse: revision order differs from creation order. Earlier revision numbers and rollback time are unavailable.'
        );
      }
    }
  );

  it.each([0, 10])(
    'groups revisions %s seconds apart and exposes every revision link',
    async gap => {
      history = { items: [revision(1, now - 3600), revision(2, now - 3600 + gap)] };
      renderChart();
      const label = await screen.findByText('r1 +1');
      expect(screen.getAllByRole('button', { name: /^r\d/ })).toHaveLength(1);
      expect(revisionLines()).toHaveLength(2);
      fireEvent.mouseOver(label);
      const tooltip = await screen.findByRole('dialog');
      expect(tooltip).toHaveTextContent('Current revision: r1');
      expect(tooltip).toHaveTextContent('Current revision: r2');
      expect(
        within(tooltip).getAllByText(
          'Markers show retained revision object creation times, not rollout completion.'
        )
      ).toHaveLength(1);
      expect(screen.getByRole('link', { name: 'web-1' })).toBeVisible();
      expect(screen.getByRole('link', { name: 'web-2' })).toBeVisible();
    }
  );

  it('keeps all hourly revision positions in a shared label at a 24-hour timespan', async () => {
    const timestamps = [0, 1, 2, 3].map(index => now - (4 - index) * 3600);
    history = { items: timestamps.map((timestamp, index) => revision(100 + index, timestamp)) };
    renderChart();
    await screen.findByRole('combobox', { name: 'Timespan' });
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Timespan' }));
    fireEvent.click(await screen.findByRole('option', { name: '24 hours' }));
    const marker = await screen.findByRole('button', { name: 'r100 +3' });
    expect(screen.getAllByRole('button', { name: /^r\d/ })).toHaveLength(1);
    const lines = revisionLines();
    expect(lines).toHaveLength(4);
    const gridLine = document.querySelector('.recharts-cartesian-grid-horizontal line');
    if (!gridLine) throw new Error('Missing plot bounds');
    const left = Number(gridLine.getAttribute('x1'));
    const width = Number(gridLine.getAttribute('x2')) - left;
    expect(width).toBeGreaterThan(0);
    const positions = lines
      .map(line => {
        expect(line).toHaveAttribute('pointer-events', 'none');
        expect(line).not.toHaveAttribute('tabindex');
        expect(line.getAttribute('x1')).toBe(line.getAttribute('x2'));
        return Number(line.getAttribute('x1'));
      })
      .sort((a, b) => a - b);
    timestamps.forEach((timestamp, index) => {
      expect(positions[index]).toBeCloseTo(left + ((timestamp - (now - 86400)) / 86400) * width, 3);
    });
    fireEvent.click(marker);
    const dialog = await screen.findByRole('dialog', { name: 'r100 +3' });
    expect(within(dialog).getAllByRole('link')).toHaveLength(4);
  });

  it('keeps a paused response and its marker range fixed when hover occurs much later', async () => {
    history = { items: [revision(2, now - 3600)] };
    renderChart();
    await screen.findByText('cpu (cores)', { exact: true });
    await screen.findByText('r2');
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    const requests = metricRequests().length;
    vi.spyOn(Date, 'now').mockReturnValue((now + 86400) * 1000);
    fireEvent.mouseOver(screen.getByRole('button', { name: 'r2' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('Current revision: r2');
    expect(screen.getByRole('button', { name: 'r2' })).toBeVisible();
    expect(metricRequests()).toHaveLength(requests);
  });

  it('keeps metric tooltips suppressed while another focused revision tooltip remains open', async () => {
    history = { items: [revision(1, now - 7200), revision(2, now - 600)] };
    renderChart();
    await screen.findByText('cpu (cores)', { exact: true });
    await screen.findByText('r2');
    const first = screen.getByRole('button', { name: 'r1' });
    fireEvent.keyDown(document, { key: 'Tab' });
    act(() => first.focus());
    await screen.findByRole('dialog');
    const second = screen.getByRole('button', { name: 'r2' });
    fireEvent.mouseOver(second);
    await waitFor(() => expect(screen.getAllByRole('dialog')).toHaveLength(2));
    fireEvent.mouseLeave(second);
    await waitFor(() => expect(screen.getAllByRole('dialog')).toHaveLength(1));
    const surface = document.querySelector('.recharts-surface');
    if (!surface) throw new Error('Missing metric chart');
    fireEvent.mouseMove(surface, { clientX: 400, clientY: 200 });
    expect(document.querySelector('.recharts-tooltip-wrapper')).toHaveStyle('visibility: hidden');
  });

  it.each(['{Enter}', ' '])(
    'makes grouped revision links keyboard accessible with %s',
    async key => {
      const user = userEvent.setup();
      history = { items: [revision(1, now - 3600), revision(2, now - 3600)] };
      renderChart();
      const marker = await screen.findByRole('button', { name: 'r1 +1' });
      expect(marker).toHaveAccessibleDescription(/Press Enter or Space to open details\./);
      act(() => marker.focus());
      await user.keyboard(key);
      const dialog = await screen.findByRole('dialog', { name: 'r1 +1' });
      expect(dialog).toBeVisible();
      expect(
        within(dialog).getAllByText(
          'Markers show retained revision object creation times, not rollout completion.'
        )
      ).toHaveLength(1);
      expect(marker).toHaveAttribute('aria-expanded', 'true');
      const first = screen.getByRole('link', { name: 'web-1' });
      await waitFor(() => expect(first).toHaveFocus());
      await user.tab();
      expect(screen.getByRole('link', { name: 'web-2' })).toHaveFocus();
      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(marker).toHaveFocus();
      expect(marker).toHaveAttribute('aria-expanded', 'false');
    }
  );

  it('restores marker focus after closing details with the close button', async () => {
    const user = userEvent.setup();
    history = { items: [revision(2, now - 3600)] };
    renderChart();
    const marker = await screen.findByRole('button', { name: 'r2' });
    await user.click(marker);
    await screen.findByRole('dialog', { name: 'r2' });
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(marker).toHaveFocus();
  });

  it('navigates to a revision using the focused popover link and closes the details', async () => {
    const user = userEvent.setup();
    history = { items: [revision(2, now - 3600)] };
    renderChart();
    const marker = await screen.findByRole('button', { name: 'r2' });
    act(() => marker.focus());
    await user.keyboard('{Enter}');
    const link = await screen.findByRole('link', { name: 'web-2' });
    await waitFor(() => expect(link).toHaveFocus());
    await user.keyboard('{Enter}');
    expect(window.location.pathname).toBe('/c/alpha/replicasets/apps/web-2');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    window.history.replaceState({}, '', '/');
  });

  it.each([
    ['ArrowDown', 140],
    ['ArrowUp', 60],
    ['PageDown', 260],
    ['PageUp', 0],
    ['Home', 0],
    ['End', 800],
  ] as const)(
    'scrolls focused-marker details with %s without scrolling the page',
    async (key, top) => {
      const user = userEvent.setup();
      history = { items: [revision(2, now - 3600)] };
      renderChart();
      const marker = await screen.findByRole('button', { name: 'r2' });
      await user.keyboard('{Tab}');
      act(() => marker.focus());
      const preview = await screen.findByRole('dialog', { name: 'r2' });
      expect(preview).toHaveAttribute('aria-modal', 'false');
      expect(marker).toHaveAttribute('aria-controls', preview.id);
      expect(marker).toHaveAccessibleDescription(/Page Up\/Down/);
      const region = within(preview).getByRole('region', { name: 'r2' });
      overflowDetails(region);
      region.scrollTop = 100;
      expect(fireEvent.keyDown(marker, { key })).toBe(false);
      expect(region.scrollTop).toBe(top);
      expect(marker).toHaveFocus();
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    }
  );

  it('does not steal focus on hover and dismisses without moving unrelated focus', async () => {
    const user = userEvent.setup();
    history = { items: [revision(2, now - 3600)] };
    renderChart();
    const marker = await screen.findByRole('button', { name: 'r2' });
    const pause = screen.getByRole('button', { name: 'Pause' });
    act(() => pause.focus());
    fireEvent.mouseOver(marker);
    await screen.findByRole('dialog', { name: 'r2' });
    expect(pause).toHaveFocus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(pause).toHaveFocus();
  });

  it('scrolls a directly focused preview and returns focus on Escape without reopening it', async () => {
    const user = userEvent.setup();
    history = { items: [revision(2, now - 3600)] };
    renderChart();
    const marker = await screen.findByRole('button', { name: 'r2' });
    fireEvent.mouseOver(marker);
    const preview = await screen.findByRole('dialog', { name: 'r2' });
    const region = within(preview).getByRole('region', { name: 'r2' });
    overflowDetails(region);
    act(() => region.focus());
    await user.keyboard('{End}');
    expect(region.scrollTop).toBe(800);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(marker).toHaveFocus();
    expect(marker).toHaveAttribute('aria-expanded', 'false');
  });

  it('scrolls modal details from links, contains Tab focus, and allows modifier shortcuts', async () => {
    const user = userEvent.setup();
    history = { items: [revision(1, now - 3600), revision(2, now - 3600)] };
    renderChart();
    const marker = await screen.findByRole('button', { name: 'r1 +1' });
    await user.click(marker);
    const dialog = await screen.findByRole('dialog', { name: 'r1 +1' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(marker).toHaveAttribute('aria-controls', dialog.id);
    const region = within(dialog).getByRole('region', { name: 'r1 +1' });
    overflowDetails(region);
    const first = within(dialog).getByRole('link', { name: 'web-1' });
    await waitFor(() => expect(first).toHaveFocus());
    await user.keyboard('{End}');
    expect(region.scrollTop).toBe(800);
    expect(first).toHaveFocus();
    await user.keyboard('{PageUp}');
    expect(region.scrollTop).toBe(640);
    expect(fireEvent.keyDown(first, { key: 'Home', ctrlKey: true })).toBe(true);
    expect(region.scrollTop).toBe(640);
    await user.tab({ shift: true });
    expect(region).toHaveFocus();
    await user.tab({ shift: true });
    expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.tab();
    expect(region).toHaveFocus();
    await user.keyboard('{Home}');
    expect(region.scrollTop).toBe(0);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(marker).toHaveFocus();
    expect(marker).toHaveAttribute('aria-expanded', 'false');
  });

  it('does not trap scrolling keys when details fit or intercept modified activation keys', async () => {
    const user = userEvent.setup();
    history = { items: [revision(2, now - 3600)] };
    renderChart();
    const marker = await screen.findByRole('button', { name: 'r2' });
    await user.keyboard('{Tab}');
    act(() => marker.focus());
    await screen.findByRole('dialog', { name: 'r2' });
    expect(fireEvent.keyDown(marker, { key: 'ArrowDown' })).toBe(true);
    expect(fireEvent.keyDown(marker, { key: 'Enter', ctrlKey: true })).toBe(true);
    expect(screen.queryByRole('dialog')).toHaveAttribute('aria-modal', 'false');
    await user.keyboard('{Escape}');
  });

  it('uses unique popup and instruction IDs in multiple charts and exposes the SVG as a group', async () => {
    const user = userEvent.setup();
    history = { items: [revision(2, now - 3600)] };
    renderChart();
    renderChart();
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'r2' })).toHaveLength(2));
    const markers = screen.getAllByRole('button', { name: 'r2' });
    const descriptions = markers.map(marker => marker.getAttribute('aria-describedby'));
    expect(new Set(descriptions).size).toBe(2);
    descriptions.forEach(id =>
      expect(document.getElementById(id!)).toHaveTextContent('Revision marker.')
    );
    expect(screen.getAllByRole('group', { name: 'Metrics chart' })).toHaveLength(2);
    await user.keyboard('{Tab}');
    act(() => markers[0].focus());
    const first = await screen.findByRole('dialog', { name: 'r2' });
    const firstId = first.id;
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    act(() => markers[1].focus());
    const second = await screen.findByRole('dialog', { name: 'r2' });
    expect(second.id).not.toBe(firstId);
  });

  it.each(['line', 'label'] as const)(
    'shows revision details and the caveat when hovering the marker %s',
    async target => {
      history = { items: [revision(2, now - 3600)] };
      renderChart();
      const label = await screen.findByText('r2');
      const marker = screen.getByRole('button', { name: 'r2' });
      const line = marker.querySelector('line');
      if (!line) throw new Error('Missing marker line');
      expect(line).toHaveAttribute('stroke-width', '24');
      expect(marker).toHaveAttribute('tabindex', '0');
      expect(screen.queryByText(/not rollout completion/)).not.toBeInTheDocument();
      fireEvent.mouseOver(target === 'line' ? line : label);
      const tooltip = await screen.findByRole('dialog');
      expect(tooltip).toHaveTextContent('Current revision: r2');
      expect(tooltip).toHaveTextContent('Created:');
      expect(tooltip).toHaveTextContent(
        'Markers show retained revision object creation times, not rollout completion.'
      );
    }
  );
});
