import { getTimeRange } from './util';

beforeAll(async () => {
  global.TextEncoder = require('util').TextEncoder;
  global.TextDecoder = require('util').TextDecoder;
});

describe('getTimeRange', () => {
  // Mock the current timestamp for consistent testing
  const mockNow = 1700000000;
  const day = 86400; // seconds in a day

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => mockNow * 1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each([
    ['10m', { from: mockNow - 600, to: mockNow, step: 15 }],
    ['30m', { from: mockNow - 1800, to: mockNow, step: 30 }],
    ['1h', { from: mockNow - 3600, to: mockNow, step: 60 }],
    ['24h', { from: mockNow - day, to: mockNow, step: 300 }],
    ['week', { from: mockNow - 7 * day, to: mockNow, step: 3600 }],
    [
      'today',
      {
        from: mockNow - (mockNow % day),
        to: mockNow,
        step: 300,
      },
    ],
    [
      'yesterday',
      {
        from: mockNow - (mockNow % day) - day,
        to: mockNow - (mockNow % day),
        step: 300,
      },
    ],
    // Test default case
    ['invalid-interval', { from: mockNow - 600, to: mockNow, step: 15 }],
  ])('should return correct range for %s interval', (interval, expected) => {
    const result = getTimeRange(interval);
    expect(result).toEqual(expected);
  });

  test('should handle different timestamps correctly', () => {
    // Test with a specific timestamp
    const specificTime = 1600000000;
    jest.spyOn(Date, 'now').mockImplementation(() => specificTime * 1000);

    const result = getTimeRange('1h');
    expect(result).toEqual({
      from: specificTime - 3600,
      to: specificTime,
      step: 60,
    });
  });
});
