import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getPrometheusPrefix } from '../../../util';
import { TinkerbellChart } from './TinkerbellChart';

const state = vi.hoisted(() => ({
  cluster: 'lab',
  config: {} as Record<string, { isMetricsEnabled?: boolean; tinkerbellJob?: string }>,
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (value: string) => value }),
  K8s: { useCluster: () => state.cluster },
}));
vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  SectionBox: ({ title, children }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
  Loader: ({ title }) => <div>{title}</div>,
}));
vi.mock('../../../util', () => ({
  getConfigStore: () => ({ useConfig: () => () => state.config }),
  getPrometheusPrefix: vi.fn(),
  createTickTimestampFormatter: () => String,
}));
vi.mock('../common', () => ({ PrometheusNotFoundBanner: () => <div>Prometheus not found</div> }));
vi.mock('../GenericMetricsChart/GenericMetricsChart', async () => {
  const { ToggleButton } = await vi.importActual<typeof import('@mui/material')>('@mui/material');
  return {
    CustomToggleButton: ({ value, label }) => <ToggleButton value={value}>{label}</ToggleButton>,
  };
});
vi.mock('../Chart/Chart', () => ({
  default: props => (
    <div
      data-testid="chart"
      data-refresh={props.autoRefresh}
      data-integer={!props.yAxisProps.allowDecimals}
    >
      {props.prometheusPrefix} {props.plots.map(plot => plot.query).join(' ')}
    </div>
  ),
}));
vi.mock('./metrics', () => ({
  fetchTinkerbellMetrics: vi.fn(),
  processTinkerbellMetrics: vi.fn(),
}));

describe('TinkerbellChart', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    state.cluster = 'lab';
    state.config = { lab: { isMetricsEnabled: true, tinkerbellJob: 'lab-tinkerbell' } };
    vi.mocked(getPrometheusPrefix).mockResolvedValue('monitoring/services/prometheus:9090');
  });

  it('does not fetch or render when metrics are disabled', () => {
    state.config.lab.isMetricsEnabled = false;
    render(<TinkerbellChart controller="workflow" />);
    expect(screen.queryByRole('heading')).toBeNull();
    expect(getPrometheusPrefix).not.toHaveBeenCalled();
  });

  it.each(['workflow', 'machine', 'job', 'task'] as const)(
    'uses %s controller queries and identifies their scope',
    async controller => {
      render(<TinkerbellChart controller={controller} />);
      const chart = await screen.findByTestId('chart');
      expect(chart.textContent).toContain(`job="lab-tinkerbell",controller="${controller}"`);
      expect(screen.getByText(/Controller-wide metrics/)).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Queue' }));
      expect(screen.getByTestId('chart').textContent).toContain('workqueue_depth');
      expect(screen.getByTestId('chart').getAttribute('data-integer')).toBe('true');
      fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
      expect(screen.getByTestId('chart').getAttribute('data-refresh')).toBe('false');
      fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
      expect(screen.getByTestId('chart').getAttribute('data-refresh')).toBe('true');
      fireEvent.click(screen.getByRole('button', { name: 'Duration' }));
      expect(screen.getByTestId('chart').textContent).toContain('histogram_quantile');
    }
  );

  it('shows a missing Prometheus state', async () => {
    vi.mocked(getPrometheusPrefix).mockResolvedValue(null);
    render(<TinkerbellChart controller="workflow" />);
    expect(await screen.findByText('Prometheus not found')).toBeTruthy();
    expect(screen.queryByTestId('chart')).toBeNull();
  });

  it('shows discovery errors separately from missing Prometheus', async () => {
    vi.mocked(getPrometheusPrefix).mockRejectedValue(new Error('Forbidden'));
    render(<TinkerbellChart controller="workflow" />);
    expect(await screen.findByText('Error fetching Prometheus Info')).toBeTruthy();
  });

  it('does not mount queries for a blank scrape job', async () => {
    state.config.lab.tinkerbellJob = '';
    render(<TinkerbellChart controller="workflow" />);
    expect(await screen.findByText(/Scrape Job is not configured/)).toBeTruthy();
    expect(screen.queryByTestId('chart')).toBeNull();
  });

  it('discards discovery from the previous cluster and resets source settings', async () => {
    let resolveOld: (prefix: string) => void;
    vi.mocked(getPrometheusPrefix).mockReturnValueOnce(
      new Promise(resolve => {
        resolveOld = resolve;
      })
    );
    const { rerender } = render(<TinkerbellChart controller="workflow" />);
    expect(screen.getByText('Loading Prometheus Info')).toBeTruthy();
    state.cluster = 'other';
    state.config.other = { isMetricsEnabled: true, tinkerbellJob: 'other-job' };
    vi.mocked(getPrometheusPrefix).mockResolvedValue('other/services/prometheus:9090');
    rerender(<TinkerbellChart controller="workflow" />);
    expect((await screen.findByTestId('chart')).textContent).toContain('other-job');
    resolveOld!('old/services/prometheus:9090');
    await waitFor(() =>
      expect(screen.getByTestId('chart').textContent).not.toContain('old/services')
    );
  });
});
