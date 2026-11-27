import {
  escapePrometheusLabelValue,
  getTimeRangeAndStepSize,
  isArgoCDApplication,
  supportsPrometheusMetrics,
} from './util';

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
    ['30m', 'medium', { from: 1699998194, to: 1699999994, step: 7 }],
    ['3h', 'medium', { from: 1699989169, to: 1699999969, step: 43 }],
    ['24h', 'medium', { from: 1699913520, to: 1699999920, step: 345 }],
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
    ['week', 'medium', { from: 1699393411, to: 1699998211, step: 2419 }],
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
    ['1h', 'low', { from: 1699996392, to: 1699999992, step: 36 }], // timeRange / 100
    ['1h', 'medium', { from: 1699996394, to: 1699999994, step: 14 }], // timeRange / 250
    ['1h', 'high', { from: mockNow - 3600, to: mockNow, step: 4 }], // timeRange / 750

    // Fixed step sizes with same interval
    ['1h', '30s', { from: 1699996380, to: 1699999980, step: 30 }],
    ['1h', '15m', { from: 1699995600, to: 1699999200, step: 900 }],
    ['1h', '1h', { from: 1699995600, to: 1699999200, step: 3600 }],

    // Edge cases
    ['1m', 'medium', { from: mockNow - 60, to: mockNow, step: 1 }], // Minimum step size is 1
    ['14d', 'medium', { from: 1698786192, to: 1699995792, step: 4838 }], // Large time range
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
      { from: 1699996394, to: 1699999994, step: 14 },
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
      from: 1599996396,
      to: 1599999996,
      step: 14,
    });
  });

  test('should quantize timestamps to step boundary to prevent auto-refresh flicker', () => {
    const unalignedTime = 1700000007; // 7 seconds after step boundary
    vitest.spyOn(Date, 'now').mockImplementation(() => unalignedTime * 1000);

    const result = getTimeRangeAndStepSize('1h', '30s');
    // Expected step is 30s; 1700000007 % 30 = 27
    expect(result).toEqual({
      from: 1699996380,
      to: 1699999980,
      step: 30,
    });
  });

  test('should preserve midnight for today when snapping the live end timestamp', () => {
    vitest.spyOn(Date, 'now').mockImplementation(() => 1700000007 * 1000);

    const result = getTimeRangeAndStepSize('today', 'medium');
    const midnight = 1700000007 - (1700000007 % 86400);

    expect(result).toEqual({
      from: midnight,
      to: 1700000000,
      step: 320,
    });
  });

  describe('calendar and refresh boundaries', () => {
    const midnight = Date.parse('2023-11-14T00:00:00Z') / 1000;

    function rangeAt(now: number, interval: string, resolution: string) {
      vitest.mocked(Date.now).mockReturnValue(now * 1000);
      return getTimeRangeAndStepSize(interval, resolution);
    }

    test.each([
      ['low', 864],
      ['medium', 345],
      ['high', 115],
      ['30s', 30],
      ['1h', 3600],
    ])('keeps yesterday on UTC day boundaries with %s resolution', (resolution, step) => {
      expect(rangeAt(midnight - 1, 'yesterday', resolution)).toEqual({
        from: midnight - 2 * day,
        to: midnight - day,
        step,
      });
      const previousDay = { from: midnight - day, to: midnight, step };
      expect(rangeAt(midnight, 'yesterday', resolution)).toEqual(previousDay);
      expect(rangeAt(midnight + 1, 'yesterday', resolution)).toEqual(previousDay);
    });

    test.each(['low', 'medium', 'high'])(
      'starts today at UTC midnight with %s resolution',
      resolution => {
        expect(rangeAt(midnight, 'today', resolution)).toEqual({
          from: midnight,
          to: midnight,
          step: 1,
        });
        expect(rangeAt(midnight + 1, 'today', resolution)).toEqual({
          from: midnight,
          to: midnight + 1,
          step: 1,
        });
      }
    );

    test.each([
      ['30s', 30, 1800],
      ['1h', 3600, 0],
    ])('aligns today with the %s fixed step', (resolution, step, endOffset) => {
      const startOfDay = { from: midnight, to: midnight, step };
      expect(rangeAt(midnight, 'today', resolution)).toEqual(startOfDay);
      expect(rangeAt(midnight + 1, 'today', resolution)).toEqual(startOfDay);
      expect(rangeAt(midnight + 1801, 'today', resolution)).toEqual({
        from: midnight,
        to: midnight + endOffset,
        step,
      });
    });

    test.each([
      // Elapsed seconds at the step increase, then the expected last sample before it.
      ['low', 32100, 32000, 320, 321],
      ['medium', 80250, 80000, 320, 321],
      ['high', 75000, 74943, 99, 100],
    ])(
      'advances today across a 10-second refresh at a %s step increase',
      (resolution, transition, previousEnd, previousStep, nextStep) => {
        expect(rangeAt(midnight + transition - 10, 'today', resolution)).toEqual({
          from: midnight,
          to: midnight + previousEnd,
          step: previousStep,
        });
        expect(rangeAt(midnight + transition, 'today', resolution)).toEqual({
          from: midnight,
          to: midnight + transition,
          step: nextStep,
        });
      }
    );

    test('keeps a relative range stable and shifts it by one step at the boundary', () => {
      const firstRange = { from: midnight - 3600, to: midnight, step: 30 };
      expect(rangeAt(midnight + 1, '1h', '30s')).toEqual(firstRange);
      expect(rangeAt(midnight + 29, '1h', '30s')).toEqual(firstRange);
      expect(rangeAt(midnight + 30, '1h', '30s')).toEqual({
        from: midnight - 3570,
        to: midnight + 30,
        step: 30,
      });
    });

    test('advances a relative range with a one-second step', () => {
      expect(rangeAt(midnight, '1m', 'high')).toEqual({
        from: midnight - 60,
        to: midnight,
        step: 1,
      });
      expect(rangeAt(midnight + 1, '1m', 'high')).toEqual({
        from: midnight - 59,
        to: midnight + 1,
        step: 1,
      });
    });

    test('keeps the historical lastweek range at UTC midnight', () => {
      expect(rangeAt(midnight, 'lastweek', 'medium')).toEqual({
        from: midnight - 14 * day,
        to: midnight - 7 * day,
        step: 2419,
      });
    });

    test('falls back to a ten-minute relative range at medium resolution', () => {
      expect(rangeAt(midnight + 3, 'invalid', 'invalid')).toEqual({
        from: midnight - 598,
        to: midnight + 2,
        step: 2,
      });
    });
  });
});

describe('supportsPrometheusMetrics', () => {
  const shop = { name: 'default', namespace: 'shop' };

  test.each([
    ['Workflow', 'tinkerbell.org/v1alpha1'],
    ['Machine', 'bmc.tinkerbell.org/v1alpha1'],
    ['Job', 'bmc.tinkerbell.org/v1alpha1'],
    ['Task', 'bmc.tinkerbell.org/v1alpha1'],
  ])('supports Tinkerbell %s in %s', (kind, apiVersion) => {
    expect(supportsPrometheusMetrics({ kind, apiVersion })).toBe(true);
  });

  test.each(['Hardware', 'Template', 'WorkflowRuleSet'])('does not invent metrics for %s', kind => {
    expect(supportsPrometheusMetrics({ kind, apiVersion: 'tinkerbell.org/v1alpha1' })).toBe(false);
  });

  test.each([
    ['supports Pods', { kind: 'Pod', jsonData: { kind: 'Pod', apiVersion: 'v1' } }, true],
    [
      'supports Kubernetes Jobs',
      { kind: 'Job', jsonData: { kind: 'Job', apiVersion: 'batch/v1' } },
      true,
    ],
    [
      'rejects non-Kubernetes Jobs with same kind',
      { kind: 'Job', jsonData: { kind: 'Job', apiVersion: 'batch.volcano.sh/v1alpha1' } },
      false,
    ],
    [
      'supports CronJobs through the shared allowlist',
      { kind: 'CronJob', jsonData: { kind: 'CronJob', apiVersion: 'batch/v1' } },
      true,
    ],
    [
      'supports ScaledObjects from known supported kinds',
      { kind: 'ScaledObject', jsonData: { kind: 'ScaledObject', apiVersion: 'keda.sh/v1alpha1' } },
      true,
    ],
    [
      'supports Volcano Queues',
      { kind: 'Queue', jsonData: { kind: 'Queue', apiVersion: 'scheduling.volcano.sh/v1beta1' } },
      true,
    ],
    [
      'rejects non-Volcano Queues with same kind',
      { kind: 'Queue', jsonData: { kind: 'Queue', apiVersion: 'example.com/v1' } },
      false,
    ],
    ['rejects Queues without apiVersion', { kind: 'Queue', jsonData: { kind: 'Queue' } }, false],
    [
      'supports Argo CD Applications when the chart UI is available',
      {
        kind: 'Application',
        jsonData: { kind: 'Application', apiVersion: 'argoproj.io/v1alpha1' },
      },
      true,
    ],
    [
      'rejects non-Argo Applications with the same kind',
      { kind: 'Application', jsonData: { kind: 'Application', apiVersion: 'example.com/v1' } },
      false,
    ],
    [
      'supports Kueue ClusterQueues',
      {
        kind: 'ClusterQueue',
        jsonData: { kind: 'ClusterQueue', apiVersion: 'kueue.x-k8s.io/v1beta2' },
      },
      true,
    ],
    [
      'rejects non-Kueue ClusterQueues with the same kind',
      { kind: 'ClusterQueue', jsonData: { kind: 'ClusterQueue', apiVersion: 'example.com/v1' } },
      false,
    ],
    [
      'supports Knative Brokers',
      {
        kind: 'Broker',
        jsonData: { kind: 'Broker', apiVersion: 'eventing.knative.dev/v1', metadata: shop },
      },
      true,
    ],
    [
      'rejects Knative kinds without metrics',
      {
        kind: 'EventType',
        jsonData: { kind: 'EventType', apiVersion: 'eventing.knative.dev/v1beta3', metadata: shop },
      },
      false,
    ],
    ['rejects unknown kinds', { kind: 'VolcanoJob', jsonData: { kind: 'VolcanoJob' } }, false],
    ['rejects missing resources', undefined, false],
  ])('%s', (_, resource, expected) => {
    expect(supportsPrometheusMetrics(resource)).toBe(expected);
  });
});

describe('escapePrometheusLabelValue', () => {
  test('escapes backslashes, quotes and line breaks', () => {
    expect(escapePrometheusLabelValue('a\\b"c\nd')).toBe('a\\\\b\\"c\\nd');
  });

  test('leaves other values unchanged', () => {
    expect(escapePrometheusLabelValue('catch-all.shop')).toBe('catch-all.shop');
  });
});

describe('isArgoCDApplication', () => {
  test.each([
    [
      'recognizes the Argo CD Application CRD',
      {
        kind: 'Application',
        jsonData: { kind: 'Application', apiVersion: 'argoproj.io/v1alpha1' },
      },
      true,
    ],
    [
      'rejects another Application kind',
      { kind: 'Application', jsonData: { kind: 'Application', apiVersion: 'example.com/v1' } },
      false,
    ],
    ['rejects an Application without an API version', { kind: 'Application' }, false],
  ])('%s', (_, resource, expected) => {
    expect(isArgoCDApplication(resource)).toBe(expected);
  });
});
