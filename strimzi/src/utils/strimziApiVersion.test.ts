import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import {
  resolveStrimziApiVersions,
  getStrimziApiVersions,
  _resetStrimziApiVersionCache,
} from './strimziApiVersion';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: {
    request: vi.fn(),
  },
}));

const mockRequest = ApiProxy.request as ReturnType<typeof vi.fn>;

function makeGroupList(names: string[], versionMap: Record<string, string[]> = {}) {
  return {
    groups: names.map(name => ({
      name,
      versions: (versionMap[name] ?? ['v1beta2']).map(v => ({ version: v })),
      preferredVersion: { version: (versionMap[name] ?? ['v1beta2']).at(-1) },
    })),
  };
}

beforeEach(() => {
  _resetStrimziApiVersionCache();
  vi.clearAllMocks();
});

describe('resolveStrimziApiVersions', () => {
  it('returns v1 when kafka.strimzi.io exposes v1', async () => {
    mockRequest.mockResolvedValue(
      makeGroupList(['kafka.strimzi.io', 'core.strimzi.io'], {
        'kafka.strimzi.io': ['v1beta2', 'v1'],
        'core.strimzi.io': ['v1beta2', 'v1'],
      })
    );

    const result = await resolveStrimziApiVersions();
    expect(result.installed).toBe(true);
    expect(result.kafka).toBe('v1');
    expect(result.core).toBe('v1');
    expect(result.ready).toBe(true);
  });

  it('falls back to v1beta2 when only v1beta2 is served', async () => {
    mockRequest.mockResolvedValue(
      makeGroupList(['kafka.strimzi.io', 'core.strimzi.io'])
    );

    const result = await resolveStrimziApiVersions();
    expect(result.installed).toBe(true);
    expect(result.kafka).toBe('v1beta2');
    expect(result.core).toBe('v1beta2');
  });

  it('sets installed=false when kafka.strimzi.io is absent', async () => {
    mockRequest.mockResolvedValue(makeGroupList(['apps', 'batch']));

    const result = await resolveStrimziApiVersions();
    expect(result.installed).toBe(false);
    expect(result.ready).toBe(true);
  });

  it('returns safe default and does not cache on transient network error', async () => {
    mockRequest.mockRejectedValueOnce(new Error('network error'));

    const result = await resolveStrimziApiVersions();
    // Returns usable default.
    expect(result.kafka).toBe('v1beta2');
    expect(result.installed).toBe(true);

    // Cache must NOT be populated after an error.
    expect(getStrimziApiVersions().ready).toBe(false);

    // Second call should retry (mock now succeeds with v1).
    mockRequest.mockResolvedValue(
      makeGroupList(['kafka.strimzi.io'], { 'kafka.strimzi.io': ['v1'] })
    );
    const retry = await resolveStrimziApiVersions();
    expect(retry.kafka).toBe('v1');
    expect(retry.installed).toBe(true);
  });

  it('makes only one /apis request even when called concurrently', async () => {
    mockRequest.mockResolvedValue(
      makeGroupList(['kafka.strimzi.io'], { 'kafka.strimzi.io': ['v1'] })
    );

    const [r1, r2, r3] = await Promise.all([
      resolveStrimziApiVersions(),
      resolveStrimziApiVersions(),
      resolveStrimziApiVersions(),
    ]);

    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(r1.kafka).toBe('v1');
    expect(r2.kafka).toBe('v1');
    expect(r3.kafka).toBe('v1');
  });

  it('returns cached result on subsequent calls', async () => {
    mockRequest.mockResolvedValue(
      makeGroupList(['kafka.strimzi.io'], { 'kafka.strimzi.io': ['v1'] })
    );

    await resolveStrimziApiVersions();
    await resolveStrimziApiVersions();

    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(getStrimziApiVersions().kafka).toBe('v1');
  });
});
