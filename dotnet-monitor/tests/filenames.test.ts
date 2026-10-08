import { describe, expect, it } from 'vitest';
import { defaultFileName, dumpFileName, gcdumpFileName, sanitizeFileName, traceFileName } from '../src/api/dotnetMonitor';

describe('file naming', () => {
  it('sanitizes names', () => {
    expect(sanitizeFileName('My Pod/Name')).toBe('my-pod-name');
  });

  it('builds diagnostic filenames', () => {
    expect(defaultFileName('My Pod', 'api', 1234, 'full.dmp')).toBe('my-pod-api-1234-full.dmp');
    expect(dumpFileName('my-pod', 'api', 1234, 'Full')).toBe('my-pod-api-1234-full.dmp');
    expect(dumpFileName('my-pod', 'api', 1234, 'WithHeap')).toBe('my-pod-api-1234-heap.dmp');
    expect(dumpFileName('my-pod', 'api', 1234, 'Mini')).toBe('my-pod-api-1234-mini.dmp');
    expect(gcdumpFileName('my-pod', 'api', 1234)).toBe('my-pod-api-1234.gcdump');
    expect(traceFileName('my-pod', 'api', 1234)).toBe('my-pod-api-1234.nettrace');
  });
});

