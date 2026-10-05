import { fetchMetrics } from '../../../request';
import { fetchTinkerbellMetrics, processTinkerbellMetrics } from './metrics';

vi.mock('../../../request', () => ({ fetchMetrics: vi.fn() }));

const options = {
  prefix: 'monitoring/services/prometheus:9090',
  query: 'test',
  from: 1,
  to: 2,
  step: 1,
};

describe('Tinkerbell metric samples', () => {
  afterEach(() => vi.resetAllMocks());

  it('preserves zero and decimal values while leaving non-finite gaps', () => {
    expect(
      processTinkerbellMetrics({
        data: {
          result: [
            {
              values: [
                [1, '0'],
                [2, '0.002'],
                [3, 'NaN'],
                [4, '+Inf'],
                [5, '-Inf'],
                [6, ''],
              ],
            },
          ],
        },
      })
    ).toEqual([
      { timestamp: 1, y: 0 },
      { timestamp: 2, y: 0.002 },
      { timestamp: 3, y: null },
      { timestamp: 4, y: null },
      { timestamp: 5, y: null },
      { timestamp: 6, y: null },
    ]);
    expect(processTinkerbellMetrics({})).toEqual([]);
  });

  it.each([{ values: [] }, { values: [[1, 'NaN']] }, { values: [[1, '+Inf']] }])(
    'exposes entirely unobserved data as no data',
    async ({ values }) => {
      vi.mocked(fetchMetrics).mockResolvedValue({
        status: 'success',
        data: { result: [{ values }] },
      });
      expect((await fetchTinkerbellMetrics(options)).data?.result).toEqual([]);
    }
  );

  it('does not replace real zero measurements or partial gaps', async () => {
    const response = {
      status: 'success',
      data: {
        result: [
          {
            values: [
              [1, '0'],
              [2, 'NaN'],
            ],
          },
        ],
      },
    };
    vi.mocked(fetchMetrics).mockResolvedValue(response);
    expect(await fetchTinkerbellMetrics(options)).toEqual(response);
    expect(fetchMetrics).toHaveBeenCalledWith(options);
  });

  it('handles absent series without generating zero', async () => {
    vi.mocked(fetchMetrics).mockResolvedValue({ status: 'success', data: { result: [] } });
    expect((await fetchTinkerbellMetrics(options)).data?.result).toEqual([]);
  });

  it('propagates permission and query failures', async () => {
    vi.mocked(fetchMetrics).mockRejectedValue(new Error('Forbidden'));
    await expect(fetchTinkerbellMetrics(options)).rejects.toThrow('Forbidden');
    const response = { status: 'error', error: 'bad query' };
    vi.mocked(fetchMetrics).mockResolvedValue(response);
    expect(await fetchTinkerbellMetrics(options)).toEqual(response);
  });

  it('rejects unexpected multiple series instead of silently dropping them', async () => {
    vi.mocked(fetchMetrics).mockResolvedValue({
      status: 'success',
      data: { result: [{ values: [] }, { values: [] }] },
    });
    await expect(fetchTinkerbellMetrics(options)).rejects.toThrow('single aggregated');
  });
});
