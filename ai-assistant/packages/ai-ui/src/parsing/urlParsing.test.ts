import { describe, expect, it } from 'vitest';
import { isLogRequest, isSpecificResourceRequestHelper } from './urlParsing';

describe('isLogRequest', () => {
  it('returns true for URLs with /log?', () => {
    expect(isLogRequest('/api/v1/namespaces/default/pods/my-pod/log?container=app')).toBe(true);
  });

  it('returns true for URLs ending with /log', () => {
    expect(isLogRequest('/api/v1/namespaces/default/pods/my-pod/log')).toBe(true);
  });

  it('returns true for URLs with /log&', () => {
    expect(isLogRequest('/api/v1/namespaces/default/pods/my-pod/log&follow=true')).toBe(true);
  });

  it('returns false when the URL is not a log request', () => {
    expect(isLogRequest('/api/v1/namespaces/default/pods/my-pod')).toBe(false);
  });

  it('returns false for /logs paths', () => {
    expect(isLogRequest('/api/v1/namespaces/default/pods/my-pod/logs')).toBe(false);
  });
});

describe('isSpecificResourceRequestHelper', () => {
  it('returns false for list endpoints', () => {
    expect(isSpecificResourceRequestHelper('/api/v1/pods')).toBe(false);
  });

  it('returns true for a specific core resource', () => {
    expect(isSpecificResourceRequestHelper('/api/v1/namespaces/default/pods/my-pod')).toBe(true);
  });

  it('returns false for API roots', () => {
    expect(isSpecificResourceRequestHelper('/api/v1/namespaces')).toBe(false);
  });

  it('returns true for a namespaced API group resource', () => {
    expect(
      isSpecificResourceRequestHelper('/apis/apps/v1/namespaces/default/deployments/my-deploy')
    ).toBe(true);
  });

  it('treats trailing-slash list endpoints as lists', () => {
    expect(isSpecificResourceRequestHelper('/apis/apps/v1/deployments/')).toBe(false);
  });

  it('checks adversarial URLs in linear time', () => {
    const url = `${'/api/'.repeat(50_000)}!`;
    const start = performance.now();
    isSpecificResourceRequestHelper(url);
    expect(performance.now() - start).toBeLessThan(500);
  });
});
