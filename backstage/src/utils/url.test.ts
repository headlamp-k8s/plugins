import { describe, expect, it } from 'vitest';
import { validateUrl } from './url';

describe('validateUrl', () => {
  it('should return true for valid http and https URLs', () => {
    expect(validateUrl('http://backstage.example.com')).toBe(true);
    expect(validateUrl('https://backstage.example.com')).toBe(true);
    expect(validateUrl('http://localhost:7007')).toBe(true);
    expect(validateUrl('https://127.0.0.1:7007/path')).toBe(true);
  });

  it('should return false for non-http(s) schemes', () => {
    expect(validateUrl('test:demo')).toBe(false);
    expect(validateUrl('javascript:alert(1)')).toBe(false);
    expect(validateUrl('file:///etc/passwd')).toBe(false);
    expect(validateUrl('data:text/plain;base64,SGVsbG8=')).toBe(false);
    expect(validateUrl('ftp://example.com')).toBe(false);
  });

  it('should return false for invalid, malformed, or empty URLs', () => {
    expect(validateUrl('')).toBe(false);
    expect(validateUrl(undefined)).toBe(false);
    expect(validateUrl('not-a-url')).toBe(false);
    expect(validateUrl('://missing-scheme')).toBe(false);
  });
});
