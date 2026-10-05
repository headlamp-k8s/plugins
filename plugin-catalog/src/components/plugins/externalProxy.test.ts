import { afterEach, describe, expect, it } from 'vitest';
import { getExternalProxyEndpoint } from './externalProxy';

const originalUserAgent = window.navigator.userAgent;
const originalProcess = (window as unknown as Record<string, unknown>).process;

function setUserAgent(value: string) {
  Object.defineProperty(window.navigator, 'userAgent', {
    value,
    configurable: true,
  });
}

describe('getExternalProxyEndpoint', () => {
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).headlampBackendPort;
    delete (window as unknown as Record<string, unknown>).headlampBaseUrl;
    delete (window as unknown as Record<string, unknown>).ddClient;
    (window as unknown as Record<string, unknown>).process = originalProcess;
    setUserAgent(originalUserAgent);
  });

  it('uses localhost:4466 in Electron by default', () => {
    setUserAgent('Mozilla/5.0 Electron/28.0');
    expect(getExternalProxyEndpoint()).toBe('http://localhost:4466/externalproxy');
  });

  it('uses window.headlampBackendPort in Electron when set', () => {
    setUserAgent('Mozilla/5.0 Electron/28.0');
    (window as unknown as { headlampBackendPort: number }).headlampBackendPort = 5000;
    expect(getExternalProxyEndpoint()).toBe('http://localhost:5000/externalproxy');
  });

  it('uses localhost:64446 in Docker Desktop', () => {
    (window as unknown as { ddClient: unknown }).ddClient = {};
    expect(getExternalProxyEndpoint()).toBe('http://localhost:64446/externalproxy');
  });

  it('uses same-origin in production browser', () => {
    expect(getExternalProxyEndpoint()).toBe(`${window.location.origin}/externalproxy`);
  });

  it('prefixes window.headlampBaseUrl in production browser', () => {
    (window as unknown as { headlampBaseUrl: string }).headlampBaseUrl = '/headlamp';
    expect(getExternalProxyEndpoint()).toBe(`${window.location.origin}/headlamp/externalproxy`);
  });

  it('ignores headlampBaseUrl values that mean root', () => {
    (window as unknown as { headlampBaseUrl: string }).headlampBaseUrl = '/';
    expect(getExternalProxyEndpoint()).toBe(`${window.location.origin}/externalproxy`);
  });

  it('normalizes headlampBaseUrl without a leading slash', () => {
    (window as unknown as { headlampBaseUrl: string }).headlampBaseUrl = 'headlamp';
    expect(getExternalProxyEndpoint()).toBe(`${window.location.origin}/headlamp/externalproxy`);
  });

  it('normalizes headlampBaseUrl with a trailing slash', () => {
    (window as unknown as { headlampBaseUrl: string }).headlampBaseUrl = '/headlamp/';
    expect(getExternalProxyEndpoint()).toBe(`${window.location.origin}/headlamp/externalproxy`);
  });
});
