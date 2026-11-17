import '@testing-library/jest-dom/vitest';
import { lightTheme } from '@kinvolk/headlamp-plugin/lib/components/App/defaultAppThemes';
import { createMuiTheme } from '@kinvolk/headlamp-plugin/lib/lib/themes';
import { ThemeProvider } from '@mui/material/styles';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Chart, { ChartProps } from './Chart';

const now = 1794614400;
const theme = createMuiTheme(lightTheme);
const fetchMetrics = vi.fn<ChartProps['fetchMetrics']>();
let clock = now;

function metrics(at = now, value = 1) {
  const values: Array<[number, string]> = [
    [at - 60, String(value)],
    [at, String(value + 1)],
  ];
  return { status: 'success', data: { result: [{ metric: {}, values }] } };
}

function deferredMetrics() {
  let resolve!: (value: ReturnType<typeof metrics>) => void;
  const promise = new Promise<ReturnType<typeof metrics>>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

function plots(queries = ['receive', 'transmit']): ChartProps['plots'] {
  return queries.map(query => ({
    query,
    name: query,
    fillColor: '#0288d1',
    strokeColor: '#0288d1',
    dataProcessor: (response: ReturnType<typeof metrics>) =>
      response.data.result[0].values.map(([timestamp, value]) => ({ timestamp, y: Number(value) })),
  }));
}

function props(): ChartProps {
  return {
    plots: plots(),
    fetchMetrics,
    interval: '6h',
    resolution: 'high',
    prometheusPrefix: 'monitoring/services/prometheus:9090',
    autoRefresh: true,
    xAxisProps: { dataKey: 'timestamp', tickFormatter: String },
    yAxisProps: {},
    referenceLines: [
      {
        x: now - 21600,
        label: 'r1',
        tooltip: 'Revision 1',
        stroke: '#0288d1',
      },
    ],
  };
}

function chartElement(chartProps: ChartProps) {
  return (
    <ThemeProvider theme={theme}>
      <Chart {...chartProps} />
    </ThemeProvider>
  );
}

function axisText() {
  const axis = document.querySelector('.recharts-xAxis .recharts-cartesian-axis-ticks');
  if (!axis) throw new Error('Missing chart time axis');
  return axis.textContent;
}

function curvePath() {
  const curve = document.querySelector('.recharts-area-curve');
  if (!curve) throw new Error('Missing metric curve');
  return curve.getAttribute('d');
}

async function advance(seconds: number) {
  clock += seconds;
  await act(async () => vi.advanceTimersByTimeAsync(seconds * 1000));
}

describe('shared chart refresh cycles', () => {
  beforeEach(() => {
    clock = now;
    fetchMetrics.mockReset().mockResolvedValue(metrics());
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    vi.spyOn(Date, 'now').mockImplementation(() => clock * 1000);
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
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each([
    { name: 'Network', queries: ['receive', 'transmit'] },
    { name: 'Filesystem', queries: ['read', 'write'] },
  ])(
    'finishes a twelve-second $name cycle without restarting it at ten seconds',
    async ({ queries }) => {
      const first = deferredMetrics();
      const second = deferredMetrics();
      fetchMetrics.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
      render(chartElement({ ...props(), plots: plots(queries) }));
      expect(fetchMetrics).toHaveBeenCalledTimes(1);
      await advance(6);
      await act(async () => first.resolve(metrics()));
      expect(fetchMetrics).toHaveBeenCalledTimes(2);
      await advance(4);
      expect(fetchMetrics).toHaveBeenCalledTimes(2);
      await advance(2);
      await act(async () => second.resolve(metrics()));
      expect(await screen.findByRole('button', { name: 'r1' })).toBeVisible();
      for (const [request] of fetchMetrics.mock.calls) {
        expect(request).toMatchObject({ from: now - 21600, to: now });
      }
      await advance(8);
      await waitFor(() => expect(fetchMetrics).toHaveBeenCalledTimes(4));
    }
  );

  it.each([
    { name: 'Network', queries: ['receive', 'transmit'] },
    { name: 'Filesystem', queries: ['read', 'write'] },
  ])(
    'keeps $name samples, axis and boundary markers together while the second refresh query is pending',
    async ({ queries }) => {
      render(chartElement({ ...props(), plots: plots(queries) }));
      await screen.findByRole('button', { name: 'r1' });
      const originalAxis = axisText();
      const originalCurve = curvePath();
      const second = deferredMetrics();
      fetchMetrics.mockResolvedValueOnce(metrics(now + 60, 3)).mockReturnValueOnce(second.promise);
      clock = now + 50;
      await advance(10);
      await waitFor(() => expect(fetchMetrics).toHaveBeenCalledTimes(4));
      expect(fetchMetrics.mock.calls[2][0]).toMatchObject({ from: now - 21600 + 60, to: now + 60 });
      expect(screen.getByRole('button', { name: 'r1' })).toBeVisible();
      expect(axisText()).toBe(originalAxis);
      expect(curvePath()).toBe(originalCurve);
      await act(async () => second.resolve(metrics(now + 60, 3)));
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: 'r1' })).not.toBeInTheDocument()
      );
      expect(axisText()).not.toBe(originalAxis);
      expect(curvePath()).not.toBe(originalCurve);
    }
  );

  const changes: Array<{ name: string; changes: Partial<ChartProps> }> = [
    { name: 'range', changes: { interval: '30m' } },
    { name: 'resolution', changes: { resolution: '10s' } },
    { name: 'service', changes: { prometheusPrefix: 'other/services/prometheus:9090' } },
    { name: 'sub-path', changes: { subPath: '/metrics' } },
    { name: 'queries', changes: { plots: plots(['read', 'write']) } },
  ];
  it.each(changes)(
    'supersedes pending work when $name changes without letting old completion unlock the new cycle',
    async ({ changes }) => {
      const old = deferredMetrics();
      const current = deferredMetrics();
      fetchMetrics.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
      const initial = props();
      const view = render(chartElement(initial));
      expect(fetchMetrics).toHaveBeenCalledTimes(1);
      view.rerender(chartElement({ ...initial, ...changes }));
      await waitFor(() => expect(fetchMetrics).toHaveBeenCalledTimes(2));
      await act(async () => old.resolve(metrics(now - 3600, 99)));
      await advance(10);
      expect(fetchMetrics).toHaveBeenCalledTimes(2);
      await act(async () => current.resolve(metrics()));
      await screen.findByText((changes.plots ?? initial.plots)[0].name, { exact: true });
      expect(fetchMetrics).toHaveBeenCalledTimes(3);
      const currentAxis = axisText();
      await advance(10);
      await waitFor(() => expect(fetchMetrics).toHaveBeenCalledTimes(5));
      expect(currentAxis).toBeTruthy();
    }
  );

  it('invalidates pending work on navigation without issuing the remaining query', async () => {
    const pending = deferredMetrics();
    fetchMetrics.mockReturnValueOnce(pending.promise);
    const view = render(chartElement(props()));
    view.unmount();
    await act(async () => pending.resolve(metrics()));
    expect(fetchMetrics).toHaveBeenCalledTimes(1);
  });

  it('unlocks polling after a failed cycle', async () => {
    fetchMetrics.mockRejectedValueOnce(new Error('Forbidden'));
    render(chartElement(props()));
    await screen.findByText('Error: Forbidden');
    await advance(10);
    await screen.findByText('receive', { exact: true });
    expect(fetchMetrics).toHaveBeenCalledTimes(3);
  });

  it('focuses Close when revision details have no navigation links', async () => {
    const user = userEvent.setup();
    render(chartElement(props()));
    const marker = await screen.findByRole('button', { name: 'r1' });
    expect(marker).toHaveAccessibleDescription(/Press Enter or Space to open details\./);
    expect(marker).not.toHaveAccessibleDescription(/for links/);
    act(() => marker.focus());
    await user.keyboard('{Enter}');
    await screen.findByRole('dialog', { name: 'r1' });
    const close = screen.getByRole('button', { name: 'Close' });
    await waitFor(() => expect(close).toHaveFocus());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(marker).toHaveFocus();
  });

  it('keeps details open and preserves link focus when a nearby revision joins the group', async () => {
    const user = userEvent.setup();
    const initial = props();
    const first = {
      x: now - 3600,
      label: 'r1',
      stroke: '#0288d1',
      tooltip: <a href="/revisions/1">First revision</a>,
    };
    const view = render(chartElement({ ...initial, referenceLines: [first] }));
    await user.click(await screen.findByRole('button', { name: 'r1' }));
    const dialog = await screen.findByRole('dialog', { name: 'r1' });
    const link = screen.getByRole('link', { name: 'First revision' });
    await waitFor(() => expect(link).toHaveFocus());
    view.rerender(
      chartElement({
        ...initial,
        referenceLines: [
          first,
          {
            x: now - 3590,
            label: 'r2',
            stroke: '#0288d1',
            tooltip: <a href="/revisions/2">Second revision</a>,
          },
        ],
      })
    );
    expect(await screen.findByRole('dialog', { name: 'r1 +1' })).toBe(dialog);
    expect(link).toHaveFocus();
    expect(screen.getByRole('link', { name: 'Second revision' })).toBeVisible();
  });
});
