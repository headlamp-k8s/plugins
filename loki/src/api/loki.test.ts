import { describe, expect, it, vi } from 'vitest';
import {
  defaults,
  errorMessage,
  MAX_LIMIT,
  parseResponse,
  query,
  requestPath,
  searchLogs,
  timestampLabel,
} from './loki';

const config = { ...defaults, clusterValue: 'prod' };
const input = { namespace: 'shop', pod: '', container: '', text: '', start: 1000, end: 2000 };
const response = (values: string[][]) => ({
  status: 'success',
  data: { resultType: 'streams', result: [{ stream: { namespace: 'shop' }, values }] },
});
describe('Loki query contract', () => {
  it('escapes literal LogQL values without accepting raw queries', () => {
    expect(query(config, { ...input, text: '" | json', pod: 'a"b' })).toBe(
      '{cluster="prod",namespace="shop",pod="a\\"b"} |= "\\" | json"'
    );
  });
  it('keeps transport clusters and stored cluster identities separate', () => {
    const a = requestPath('context-a', config, input, 200);
    const b = requestPath('context-b', { ...config, clusterValue: 'other' }, input, 200);
    expect(a).toContain('/clusters/context-a/');
    expect(b).toContain('/clusters/context-b/');
    expect(new URLSearchParams(a.split('?')[1]).get('query')).toContain('cluster="prod"');
    expect(new URLSearchParams(b.split('?')[1]).get('query')).toContain('cluster="other"');
  });
  it('encodes timestamps without losing nanosecond precision', () => {
    expect(
      new URLSearchParams(requestPath('a', config, input, 200).split('?')[1]).get('start')
    ).toBe('1000000000');
    expect(timestampLabel('1760000000123456789')).toContain('1760000000123456789');
  });
  it.each([0, MAX_LIMIT + 1, 1.5])('rejects invalid limit %s', limit => {
    expect(() => requestPath('a', config, input, limit)).toThrow();
  });
  it('rejects invalid routes, mappings, identities and time ranges', () => {
    expect(() => requestPath('a', { ...config, service: '../../evil' }, input, 200)).toThrow();
    expect(() => requestPath('a', { ...config, clusterValue: '' }, input, 200)).toThrow();
    expect(() => query({ ...config, podLabel: 'namespace' }, input)).toThrow();
    expect(() => requestPath('a', config, { ...input, end: NaN }, 200)).toThrow();
    expect(() => requestPath('a', config, { ...input, end: input.start }, 200)).toThrow();
    expect(() => requestPath('a', config, { ...input, end: 99999999999 }, 200)).toThrow();
  });
});
describe('Results and requests', () => {
  it('preserves identical entries and orders streams using exact timestamps', () => {
    const values = [
      ['1760000000123456788', 'same'],
      ['1760000000123456789', 'same'],
      ['1760000000123456789', 'same'],
    ];
    const entries = parseResponse(response(values), 3);
    expect(entries.map(e => e.timestamp)).toEqual([
      '1760000000123456789',
      '1760000000123456789',
      '1760000000123456788',
    ]);
    expect(entries).toHaveLength(3);
  });
  it('expands a fixed window in one request per load, without cursor loss', async () => {
    const request = vi.fn().mockResolvedValue(
      response([
        ['1000000001', 'same'],
        ['1000000001', 'same'],
      ])
    );
    const signal = new AbortController().signal;
    const a = await searchLogs(request, 'a', config, input, 200, signal);
    const b = await searchLogs(request, 'a', config, input, 400, signal);
    expect(a).toEqual(b);
    expect(request).toHaveBeenCalledTimes(2);
    const urls = request.mock.calls.map(c => new URLSearchParams(c[0].split('?')[1]));
    expect(urls.map(u => u.get('end'))).toEqual(['2000000000', '2000000000']);
    expect(urls.map(u => u.get('limit'))).toEqual(['200', '400']);
  });
  it('rejects a response arriving after cancellation even if transport ignores abort', async () => {
    const controller = new AbortController();
    const request = vi.fn(async () => {
      controller.abort();
      return response([]);
    });
    await expect(searchLogs(request, 'a', config, input, 200, controller.signal)).rejects.toThrow(
      'Cancelled'
    );
  });
  it.each([
    null,
    {},
    { status: 'error' },
    response([['invalid', 'x']]),
    response([
      ['1', 'a'],
      ['2', 'b'],
    ]),
  ])('rejects malformed or oversized results', value => {
    expect(() => parseResponse(value, 1)).toThrow();
  });
  it('distinguishes denied access and rate limits from empty results', () => {
    expect(errorMessage({ status: 403 })).toContain('Access denied');
    expect(errorMessage({ status: 401 })).toContain('Access denied');
    expect(errorMessage({ status: 429 })).toContain('rate limiting');
    expect(parseResponse(response([]), 1)).toEqual([]);
  });
});
