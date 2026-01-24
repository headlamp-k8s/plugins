import { getTimeRangeAndStepSize, getPrometheusPrefix } from './util';

beforeAll(async () => {
  global.TextEncoder = require('util').TextEncoder;
  global.TextDecoder = require('util').TextDecoder;
});

describe('getTimeRangeAndStepSize', () => {
  // Mock the current timestamp for consistent testing
  const mockNow = 1700000000;
  const day = 86400; // seconds in a day

  beforeEach(() => {
    vitest.spyOn(Date, 'now').mockImplementation(() => mockNow * 1000);
  });

  afterEach(() => {
    vitest.restoreAllMocks();
  });

  test.each([
    ['10m', 'medium', { from: mockNow - 600, to: mockNow, step: 2 }],
    ['30m', 'medium', { from: mockNow - 1800, to: mockNow, step: 7 }],
    ['3h', 'medium', { from: mockNow - 10800, to: mockNow, step: 43 }],
    ['24h', 'medium', { from: mockNow - day, to: mockNow, step: 345 }],
    [
      'today',
      'medium',
      {
        from: mockNow - (mockNow % day),
        to: mockNow,
        step: Math.max(
          Math.floor(((mockNow - (mockNow - (mockNow % day))) * 1000) / 250 / 1000),
          1
        ),
      },
    ],
    [
      'yesterday',
      'medium',
      {
        from: mockNow - (mockNow % day) - day,
        to: mockNow - (mockNow % day),
        step: 345,
      },
    ],
    ['week', 'medium', { from: mockNow - 7 * day, to: mockNow, step: 2419 }],
    [
      'lastweek',
      'medium',
      {
        from: mockNow - 14 * day,
        to: mockNow - 7 * day,
        step: 2419,
      },
    ],

    // Different resolutions with same interval
    ['1h', 'low', { from: mockNow - 3600, to: mockNow, step: 36 }], // timeRange / 100
    ['1h', 'medium', { from: mockNow - 3600, to: mockNow, step: 14 }], // timeRange / 250
    ['1h', 'high', { from: mockNow - 3600, to: mockNow, step: 4 }], // timeRange / 750

    // Fixed step sizes with same interval
    ['1h', '30s', { from: mockNow - 3600, to: mockNow, step: 30 }],
    ['1h', '15m', { from: mockNow - 3600, to: mockNow, step: 900 }],
    ['1h', '1h', { from: mockNow - 3600, to: mockNow, step: 3600 }],

    // Edge cases
    ['1m', 'medium', { from: mockNow - 60, to: mockNow, step: 1 }], // Minimum step size is 1
    ['14d', 'medium', { from: mockNow - 14 * day, to: mockNow, step: 4838 }], // Large time range
    [
      'invalid', // Falls back to 10 minutes interval
      'medium',
      {
        from: mockNow - 600,
        to: mockNow,
        step: 2,
      },
    ],
    [
      '1h',
      'invalid', // Falls back to medium resolution
      { from: mockNow - 3600, to: mockNow, step: 14 },
    ],
  ])(
    'should return correct timeRange and stepSize for %s interval and %s resolution',
    (interval, resolution, expected) => {
      const result = getTimeRangeAndStepSize(interval, resolution);
      expect(result).toEqual(expected);
    }
  );

  test('should handle different timestamps correctly', () => {
    // Test with a specific timestamp
    const specificTime = 1600000000;
    vitest.spyOn(Date, 'now').mockImplementation(() => specificTime * 1000);

    const result = getTimeRangeAndStepSize('1h', 'medium');
    expect(result).toEqual({
      from: specificTime - 3600,
      to: specificTime,
      step: 14,
    });
  });
});

describe('getPrometheusPrefix', () => {
  afterEach(() => {
    vitest.restoreAllMocks();
  });

  test('returns external Prometheus URL and trims trailing slash', async () => {
    vitest.spyOn(require('./cluster'), 'getClusterConfig').mockReturnValue({
      address: 'https://prometheus.example.com/',
    });

    const result = await getPrometheusPrefix('test');
    expect(result).toBe('https://prometheus.example.com');
  });

  test('returns kubernetes service prefix for namespace/service', async () => {
    vitest.spyOn(require('./cluster'), 'getClusterConfig').mockReturnValue({
      address: 'monitoring/prometheus',
    });

    const result = await getPrometheusPrefix('test');
    expect(result).toBe('monitoring/services/prometheus');
  });

  test('auto-detects prometheus when enabled', async () => {
    vitest.spyOn(require('./cluster'), 'getClusterConfig').mockReturnValue({
      autoDetect: true,
    });

    vitest
      .spyOn(require('./prometheus'), 'isPrometheusInstalled')
      .mockResolvedValue({
        namespace: 'monitoring',
        type: 'services',
        name: 'prometheus',
        port: 9090,
      });

    const result = await getPrometheusPrefix('test');
    expect(result).toBe('monitoring/services/prometheus:9090');
  });

  test('returns null when auto-detect finds no prometheus', async () => {
    vitest.spyOn(require('./cluster'), 'getClusterConfig').mockReturnValue({
      autoDetect: true,
    });

    vitest
      .spyOn(require('./prometheus'), 'isPrometheusInstalled')
      .mockResolvedValue({
        type: 'none',
      });

    const result = await getPrometheusPrefix('test');
    expect(result).toBeNull();
  });
});