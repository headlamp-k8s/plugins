import { TextDecoder, TextEncoder } from 'node:util';
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('./request', () => ({
  isPrometheusInstalled: vi.fn(),
  KubernetesType: {
    none: 'none',
    services: 'services',
    pods: 'pods',
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ConfigStore: vi.fn(),
}));

import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';
import { isHttpUrl } from './helpers';
import { isPrometheusInstalled, KubernetesType } from './request';
import { getPrometheusPrefix, getTimeRangeAndStepSize } from './util';

const mockIsPrometheusInstalled = vi.mocked(isPrometheusInstalled);
const MockConfigStore = vi.mocked(ConfigStore);

beforeAll(() => {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
});

function mockClusterConfig(clusterName: string, config: Record<string, unknown> | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (MockConfigStore as any).mockImplementation(() => ({
    get: () => (config ? { [clusterName]: config } : null),
  }));
}

describe('isHttpUrl', () => {
  test.each([
    ['http://prometheus.example.com', true],
    ['https://prometheus.example.com', true],
    ['http://prometheus.example.com:9090', true],
    ['https://prometheus.example.com/api/v1', true],
    ['', false],
    ['monitoring/prometheus', false],
    ['ftp://example.com', false],
    ['not a url', false],
  ])('isHttpUrl(%s) returns %s', (input, expected) => {
    expect(isHttpUrl(input)).toBe(expected);
  });
});

describe('getPrometheusPrefix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('auto-detect mode', () => {
    test('returns detected endpoint when prometheus is found', async () => {
      mockClusterConfig('test-cluster', { autoDetect: true });
      mockIsPrometheusInstalled.mockResolvedValue({
        type: KubernetesType.services,
        namespace: 'monitoring',
        name: 'prometheus',
        port: '9090',
      });

      const result = await getPrometheusPrefix('test-cluster');
      expect(result).toBe('monitoring/services/prometheus:9090');
    });

    test('returns endpoint without port when port is empty', async () => {
      mockClusterConfig('test-cluster', { autoDetect: true });
      mockIsPrometheusInstalled.mockResolvedValue({
        type: KubernetesType.services,
        namespace: 'monitoring',
        name: 'prometheus',
        port: '',
      });

      const result = await getPrometheusPrefix('test-cluster');
      expect(result).toBe('monitoring/services/prometheus');
    });

    test('returns null when no prometheus is found', async () => {
      mockClusterConfig('test-cluster', { autoDetect: true });
      mockIsPrometheusInstalled.mockResolvedValue({
        type: KubernetesType.none,
        namespace: '',
        name: '',
        port: '',
      });

      const result = await getPrometheusPrefix('test-cluster');
      expect(result).toBeNull();
    });

    test('takes priority over manual address', async () => {
      mockClusterConfig('test-cluster', {
        autoDetect: true,
        address: 'https://manual-address.com',
      });
      mockIsPrometheusInstalled.mockResolvedValue({
        type: KubernetesType.services,
        namespace: 'monitoring',
        name: 'prometheus',
        port: '9090',
      });

      const result = await getPrometheusPrefix('test-cluster');
      expect(result).toBe('monitoring/services/prometheus:9090');
    });
  });

  describe('manual address mode', () => {
    test.each([
      ['http://prometheus.example.com:9090', 'http://prometheus.example.com:9090'],
      ['https://prometheus.example.com', 'https://prometheus.example.com'],
      ['https://prometheus.example.com/', 'https://prometheus.example.com'],
      ['monitoring/prometheus:9090', 'monitoring/services/prometheus:9090'],
      ['  monitoring/prometheus:9090  ', 'monitoring/services/prometheus:9090'],
    ])('address "%s" returns "%s"', async (address, expected) => {
      mockClusterConfig('test-cluster', { autoDetect: false, address });
      const result = await getPrometheusPrefix('test-cluster');
      expect(result).toBe(expected);
    });

    test('returns null for invalid address format', async () => {
      mockClusterConfig('test-cluster', { autoDetect: false, address: 'invalid-format' });
      const result = await getPrometheusPrefix('test-cluster');
      expect(result).toBeNull();
    });
  });

  describe('no configuration', () => {
    test('returns null when cluster config is null', async () => {
      mockClusterConfig('test-cluster', null);
      const result = await getPrometheusPrefix('test-cluster');
      expect(result).toBeNull();
    });

    test('returns null when neither autoDetect nor address is set', async () => {
      mockClusterConfig('test-cluster', {});
      const result = await getPrometheusPrefix('test-cluster');
      expect(result).toBeNull();
    });
  });
});

describe('getTimeRangeAndStepSize', () => {
  const mockNow = 1700000000;
  const day = 86400;

  beforeEach(() => {
    vi.spyOn(Date, 'now').mockImplementation(() => mockNow * 1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
      { from: mockNow - (mockNow % day) - day, to: mockNow - (mockNow % day), step: 345 },
    ],
    ['week', 'medium', { from: mockNow - 7 * day, to: mockNow, step: 2419 }],
    ['lastweek', 'medium', { from: mockNow - 14 * day, to: mockNow - 7 * day, step: 2419 }],
    // Different resolutions
    ['1h', 'low', { from: mockNow - 3600, to: mockNow, step: 36 }],
    ['1h', 'medium', { from: mockNow - 3600, to: mockNow, step: 14 }],
    ['1h', 'high', { from: mockNow - 3600, to: mockNow, step: 4 }],
    // Fixed step sizes
    ['1h', '30s', { from: mockNow - 3600, to: mockNow, step: 30 }],
    ['1h', '15m', { from: mockNow - 3600, to: mockNow, step: 900 }],
    ['1h', '1h', { from: mockNow - 3600, to: mockNow, step: 3600 }],
    // Edge cases
    ['1m', 'medium', { from: mockNow - 60, to: mockNow, step: 1 }],
    ['14d', 'medium', { from: mockNow - 14 * day, to: mockNow, step: 4838 }],
    ['invalid', 'medium', { from: mockNow - 600, to: mockNow, step: 2 }],
    ['1h', 'invalid', { from: mockNow - 3600, to: mockNow, step: 14 }],
  ])('interval=%s resolution=%s', (interval, resolution, expected) => {
    expect(getTimeRangeAndStepSize(interval, resolution)).toEqual(expected);
  });
});
