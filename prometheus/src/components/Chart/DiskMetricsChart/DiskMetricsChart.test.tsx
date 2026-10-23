import { render, screen, waitFor } from '@testing-library/react';
import { getPrometheusPrefix } from '../../../util';
import { DiskMetricsChart } from './DiskMetricsChart';

const state = vi.hoisted(() => ({
  cluster: 'lab',
  config: {} as Record<string, { isMetricsEnabled?: boolean }>,
}));

const stateSetters: Array<ReturnType<typeof vi.fn>> = [];

vi.mock('react', async importOriginal => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useState: (initial: any) => {
      const [val, setVal] = actual.useState(initial);
      const setter = vi.fn((...args: any[]) => setVal(...args));
      stateSetters.push(setter);
      return [val, setter];
    },
  };
});

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (value: string) => value }),
  K8s: { useCluster: () => state.cluster },
}));
vi.mock('@kinvolk/headlamp-plugin/lib/k8s', () => ({
  useCluster: () => state.cluster,
}));
vi.mock('@kinvolk/headlamp-plugin/lib/lib/k8s', () => ({
  useCluster: () => state.cluster,
}));
vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  SectionBox: ({ children }: any) => <section>{children}</section>,
  Loader: ({ title }: any) => <div>{title}</div>,
}));
vi.mock('../../../util', () => ({
  getConfigStore: () => ({ useConfig: () => () => state.config }),
  getPrometheusPrefix: vi.fn(),
  getPrometheusInterval: () => '1h',
  getPrometheusResolution: () => '10s',
  getPrometheusSubPath: () => '',
}));
vi.mock('../common', () => ({
  PrometheusNotFoundBanner: () => <div>Prometheus not found</div>,
}));
vi.mock('../DiskChart/DiskChart', () => ({
  DiskChart: (props: any) => (
    <div data-testid="disk-chart" data-prefix={props.prometheusPrefix}>
      {props.prometheusPrefix}
    </div>
  ),
}));

describe('DiskMetricsChart', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    stateSetters.length = 0;
    state.cluster = 'lab';
    state.config = { lab: { isMetricsEnabled: true } };
    vi.mocked(getPrometheusPrefix).mockResolvedValue('monitoring/services/prometheus:9090');
  });

  it('does not render when metrics are disabled', () => {
    state.config.lab.isMetricsEnabled = false;
    const { container } = render(<DiskMetricsChart />);
    expect(container.firstChild).toBeNull();
    expect(getPrometheusPrefix).not.toHaveBeenCalled();
  });

  it('renders disk chart when installed', async () => {
    render(<DiskMetricsChart />);
    expect(await screen.findByTestId('disk-chart')).toBeTruthy();
    expect(screen.getByTestId('disk-chart').textContent).toContain(
      'monitoring/services/prometheus:9090'
    );
  });

  it('shows not found banner when Prometheus is not found', async () => {
    vi.mocked(getPrometheusPrefix).mockResolvedValue(null);
    render(<DiskMetricsChart />);
    expect(await screen.findByText('Prometheus not found')).toBeTruthy();
  });

  it('shows error banner when discovery fails', async () => {
    vi.mocked(getPrometheusPrefix).mockRejectedValue(new Error('Connection error'));
    render(<DiskMetricsChart />);
    expect(await screen.findByText('Error fetching prometheus Info')).toBeTruthy();
  });

  it('discards discovery from the previous cluster when cluster changes before resolution', async () => {
    let resolveOld: (prefix: string | null) => void;
    vi.mocked(getPrometheusPrefix).mockReturnValueOnce(
      new Promise(resolve => {
        resolveOld = resolve;
      })
    );
    const { rerender } = render(<DiskMetricsChart />);
    expect(screen.getByText('Loading Prometheus Info')).toBeTruthy();

    state.cluster = 'other';
    state.config.other = { isMetricsEnabled: true };
    vi.mocked(getPrometheusPrefix).mockResolvedValue('other/services/prometheus:9090');
    rerender(<DiskMetricsChart />);

    expect((await screen.findByTestId('disk-chart')).textContent).toContain(
      'other/services/prometheus:9090'
    );
    resolveOld!('old/services/prometheus:9090');
    await new Promise(resolve => setTimeout(resolve, 0));

    await waitFor(() =>
      expect(screen.getByTestId('disk-chart').textContent).not.toContain('old/services')
    );
  });

  it('does not update state when unmounted before resolution', async () => {
    let resolveLookup: (prefix: string | null) => void;
    vi.mocked(getPrometheusPrefix).mockReturnValueOnce(
      new Promise(resolve => {
        resolveLookup = resolve;
      })
    );

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = render(<DiskMetricsChart />);
    expect(screen.getByText('Loading Prometheus Info')).toBeTruthy();

    stateSetters.forEach(s => s.mockClear());

    unmount();
    resolveLookup!('monitoring/services/prometheus:9090');

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    stateSetters.forEach(s => expect(s).not.toHaveBeenCalled());

    consoleErrorSpy.mockRestore();
  });

  it('does not log error or update state when unmounted before lookup rejects', async () => {
    let rejectLookup: (err: any) => void;
    vi.mocked(getPrometheusPrefix).mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectLookup = reject;
      })
    );

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = render(<DiskMetricsChart />);
    expect(screen.getByText('Loading Prometheus Info')).toBeTruthy();

    stateSetters.forEach(s => s.mockClear());

    unmount();
    rejectLookup!(new Error('Discovery failed'));

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    stateSetters.forEach(s => expect(s).not.toHaveBeenCalled());

    consoleErrorSpy.mockRestore();
  });
});
