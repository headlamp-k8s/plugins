import { describe, expect, test } from 'vitest';
import { formatByteProgress, formatBytes } from './bytes';

describe('formatBytes', () => {
  test('formats common sizes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
  });
});

describe('formatByteProgress', () => {
  test('returns N/A when total is missing', () => {
    expect(formatByteProgress(10, undefined)).toBe('N/A');
  });

  test('formats done / total', () => {
    expect(formatByteProgress(512, 1024)).toBe('512 B / 1 KB');
  });
});
