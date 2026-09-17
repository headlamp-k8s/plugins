if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) {
        delete store[k];
      }
    },
    length: 0,
    key: (index: number) => Object.keys(store)[index] || null,
  };
}

import { describe, expect, it } from 'vitest';
import { MultiKueueCluster } from './multiKueueCluster';
import { getMultiKueueClusterDetailRouteParams, renderMultiKueueConnectionStatus } from './multiKueueClusterFormatters';

describe('MultiKueueCluster resource and formatters', () => {
  it('renders connection status correctly', () => {
    expect(renderMultiKueueConnectionStatus({ type: 'Active', status: 'True' })).toBe('Connected');
    expect(renderMultiKueueConnectionStatus({ type: 'Active', status: 'False' })).toBe('Disconnected');
    expect(renderMultiKueueConnectionStatus(undefined)).toBe('Unknown');
  });

  it('correctly parses MultiKueueCluster KubeObject instances', () => {
    const rawCluster = {
      apiVersion: 'kueue.x-k8s.io/v1beta2',
      kind: 'MultiKueueCluster',
      metadata: { name: 'worker-us-east' },
      spec: {
        kubeConfig: {
          location: 'worker-us-east-secret',
          locationType: 'Secret',
        },
      },
      status: {
        conditions: [{ type: 'Active', status: 'True', reason: 'Connected' }],
      },
    };

    const cluster = new MultiKueueCluster(rawCluster as any);
    expect(cluster.kubeConfigLocation).toBe('worker-us-east-secret');
    expect(cluster.kubeConfigType).toBe('Secret');
    expect(cluster.isConnected).toBe(true);
    expect(cluster.connectionStatus).toBe('Connected');
  });

  it('handles missing detail route parameters safely', () => {
    expect(getMultiKueueClusterDetailRouteParams('worker-us-east')).toEqual({
      name: 'worker-us-east',
    });
    expect(getMultiKueueClusterDetailRouteParams(undefined)).toEqual({
      name: '',
    });
  });
});
