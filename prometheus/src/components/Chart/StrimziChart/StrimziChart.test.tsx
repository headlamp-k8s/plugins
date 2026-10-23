import { render, screen, waitFor } from '@testing-library/react';
import { getPrometheusPrefix } from '../../../util';
import { getKafkaChartConfigs, StrimziChart } from './StrimziChart';

const state = vi.hoisted(() => ({
  cluster: 'lab',
  config: {} as Record<string, { isMetricsEnabled?: boolean }>,
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (value: string) => value }),
  K8s: { useCluster: () => state.cluster },
  ApiProxy: { request: vi.fn() },
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
  getPrometheusResolution: () => 'medium',
  getPrometheusSubPath: () => '',
  createTickTimestampFormatter: () => String,
  dataProcessor: vi.fn(),
}));
vi.mock('../common', () => ({
  PrometheusNotFoundBanner: () => <div>Prometheus not found</div>,
  CustomTooltip: () => null,
  CustomTooltipFormatBytes: () => null,
}));
vi.mock('../Chart/Chart', () => ({
  default: (props: any) => (
    <div data-testid="strimzi-chart" data-prefix={props.prometheusPrefix}>
      {props.prometheusPrefix}
    </div>
  ),
}));
vi.mock('../GenericMetricsChart/GenericMetricsChart', () => ({
  CustomToggleButton: ({ value, label }: any) => <button value={value}>{label}</button>,
}));

const dummyConfigs = getKafkaChartConfigs('default');

describe('StrimziChart', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    state.cluster = 'lab';
    state.config = { lab: { isMetricsEnabled: true } };
    vi.mocked(getPrometheusPrefix).mockResolvedValue('monitoring/services/prometheus:9090');
  });

  it('does not render when metrics are disabled', () => {
    state.config.lab.isMetricsEnabled = false;
    const { container } = render(<StrimziChart chartConfigs={dummyConfigs} />);
    expect(container.firstChild).toBeNull();
    expect(getPrometheusPrefix).not.toHaveBeenCalled();
  });

  it('renders strimzi chart when installed', async () => {
    render(<StrimziChart chartConfigs={dummyConfigs} />);
    expect(await screen.findByTestId('strimzi-chart')).toBeTruthy();
    expect(screen.getByTestId('strimzi-chart').textContent).toContain(
      'monitoring/services/prometheus:9090'
    );
  });

  it('shows not found banner when Prometheus is not found', async () => {
    vi.mocked(getPrometheusPrefix).mockResolvedValue(null);
    render(<StrimziChart chartConfigs={dummyConfigs} />);
    expect(await screen.findByText('Prometheus not found')).toBeTruthy();
  });

  it('shows error banner when discovery fails', async () => {
    vi.mocked(getPrometheusPrefix).mockRejectedValue(new Error('Connection error'));
    render(<StrimziChart chartConfigs={dummyConfigs} />);
    expect(await screen.findByText('Error fetching Prometheus Info')).toBeTruthy();
  });

  it('discards discovery from the previous cluster when cluster changes before resolution', async () => {
    let resolveOld: (prefix: string | null) => void;
    vi.mocked(getPrometheusPrefix).mockReturnValueOnce(
      new Promise(resolve => {
        resolveOld = resolve;
      })
    );
    const { rerender } = render(<StrimziChart chartConfigs={dummyConfigs} />);
    expect(screen.getByText('Loading Prometheus Info')).toBeTruthy();

    state.cluster = 'other';
    state.config.other = { isMetricsEnabled: true };
    vi.mocked(getPrometheusPrefix).mockResolvedValue('other/services/prometheus:9090');
    rerender(<StrimziChart chartConfigs={dummyConfigs} />);

    expect((await screen.findByTestId('strimzi-chart')).textContent).toContain(
      'other/services/prometheus:9090'
    );
    resolveOld!('old/services/prometheus:9090');
    await new Promise(resolve => setTimeout(resolve, 0));

    await waitFor(() =>
      expect(screen.getByTestId('strimzi-chart').textContent).not.toContain('old/services')
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
    const { unmount } = render(<StrimziChart chartConfigs={dummyConfigs} />);
    expect(screen.getByText('Loading Prometheus Info')).toBeTruthy();

    unmount();
    resolveLookup!('monitoring/services/prometheus:9090');

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(consoleErrorSpy).not.toHaveBeenCalled();
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
    const { unmount } = render(<StrimziChart chartConfigs={dummyConfigs} />);
    expect(screen.getByText('Loading Prometheus Info')).toBeTruthy();

    unmount();
    rejectLookup!(new Error('Discovery failed'));

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
