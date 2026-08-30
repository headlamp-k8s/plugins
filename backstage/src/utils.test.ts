import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGet = vi.fn();

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ConfigStore: vi.fn().mockImplementation(function (this: { get: typeof mockGet }) {
    this.get = mockGet;
  }),
}));

import { ConfigStore } from '@kinvolk/headlamp-plugin/lib';
import { getClusterConfig, getConfigStore, isValidBackstageBaseUrl } from './utils';

describe('getConfigStore', () => {
  it('uses the backstage plugin config key', () => {
    getConfigStore();
    expect(ConfigStore).toHaveBeenCalledWith('@headlamp-k8s/backstage');
  });
});

describe('getClusterConfig', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('returns null when no config is stored', () => {
    mockGet.mockReturnValue(undefined);
    expect(getClusterConfig('my-cluster')).toBeNull();
  });

  it('returns null when the cluster is not in config', () => {
    mockGet.mockReturnValue({ other: { backstageUrl: 'https://example.com' } });
    expect(getClusterConfig('my-cluster')).toBeNull();
  });

  it('returns cluster config when present', () => {
    const clusterConf = { backstageUrl: 'https://backstage.example.com' };
    mockGet.mockReturnValue({ 'my-cluster': clusterConf });
    expect(getClusterConfig('my-cluster')).toEqual(clusterConf);
  });
});

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
