import { isValidBackstageBaseUrl } from './url';

describe('isValidBackstageBaseUrl', () => {
  it('allows valid http and https urls', () => {
    expect(isValidBackstageBaseUrl('https://backstage.example.com')).toBe(true);
    expect(isValidBackstageBaseUrl('http://localhost:7007')).toBe(true);
    expect(isValidBackstageBaseUrl('http://example.com/path?query=1')).toBe(true);
  });

  it('rejects unsafe or non-web protocols', () => {
    expect(isValidBackstageBaseUrl('javascript:alert(1)')).toBe(false);
    expect(isValidBackstageBaseUrl('data:text/html,<html>')).toBe(false);
    expect(isValidBackstageBaseUrl('file:///etc/passwd')).toBe(false);
    expect(isValidBackstageBaseUrl('ftp://example.com')).toBe(false);
    expect(isValidBackstageBaseUrl('test:demo')).toBe(false);
  });

  it('rejects malformed urls', () => {
    expect(isValidBackstageBaseUrl('not a url')).toBe(false);
    expect(isValidBackstageBaseUrl('://missing-protocol')).toBe(false);
    expect(isValidBackstageBaseUrl('')).toBe(false);
  });
});
