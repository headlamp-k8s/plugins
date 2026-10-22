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

  it.each([
    '/api',
    '/api/v1',
    '/apis',
    '/apis/apps',
    '/apis/apps/v1',
    '/api/v1/namespaces/default/pods',
    '/api/v1/namespaces/default/pods/',
    '/apis/apps/v1/namespaces/default/deployments',
    '/apis/example.com/v1/namespaces/default/status',
    '/api/v1/namespaces/default/pods/my.pod',
    '/api/v1/namespaces/default/pods/invalid!',
  ])('does not classify %s as a specific resource', url => {
    expect(isSpecificResourceRequestHelper(url)).toBe(false);
  });

  it.each([
    '/api/v1/pods/nginx',
    '/api/v1/nodes/worker',
    '/api/v1/namespaces/default',
    '/api/v1/namespaces/default/status',
    '/api/v1/namespaces/default/finalize',
    '/api/v1/namespaces/default/pods/nginx',
    '/api/v1/namespaces/default/pods/nginx/status',
    '/api/v1/namespaces/default/configmaps/namespaces',
    '/api/v1/namespaces/namespaces/pods/nginx',
    '/apis/apps/v1/namespaces/default/deployments/web/scale',
    '/apis/example.com/v1/widgets/namespaces',
  ])('classifies %s as a specific resource', url => {
    expect(isSpecificResourceRequestHelper(url)).toBe(true);
  });

  it.each([
    ['/api/v1/namespaces/default/pods/nginx?watch=false#details', true],
    ['https://cluster.test/api/v1/namespaces/default/pods/my-pod?watch=false', true],
    ['https://cluster.test/api/v1/namespaces/default/status?watch=false', true],
    ['https://cluster.test/api/v1/namespaces/default/pods/?watch=false#details', false],
    ['https://cluster.test/apis/apps/v1/deployments?limit=10', false],
  ])('classifies the pathname of %s', (url, expected) => {
    expect(isSpecificResourceRequestHelper(url)).toBe(expected);
  });

  it('surfaces malformed absolute URLs to the request setup error handler', () => {
    expect(() => isSpecificResourceRequestHelper('http://[')).toThrow(TypeError);
  });

  it('handles long paths ending in a specific resource', () => {
    const url = `/api/v1/${'segment/'.repeat(10_000)}pods/my-pod`;
    const start = performance.now();
    expect(isSpecificResourceRequestHelper(url)).toBe(true);
    expect(performance.now() - start).toBeLessThan(500);
  });

  it('checks adversarial URLs in linear time', () => {
    const url = `${'/api/'.repeat(50_000)}!`;
    const start = performance.now();
    isSpecificResourceRequestHelper(url);
    expect(performance.now() - start).toBeLessThan(500);
  });
});
