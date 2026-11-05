// @vitest-environment jsdom
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
import {
  getMultiKueueClusterDetailRouteParams,
  renderMultiKueueConnectionStatus,
} from './multiKueueClusterFormatters';

describe('MultiKueueCluster resource and formatters', () => {
  it('renders connection status correctly', () => {
    expect(renderMultiKueueConnectionStatus({ type: 'Active', status: 'True' })).toBe('Connected');
    expect(renderMultiKueueConnectionStatus({ type: 'Active', status: 'False' })).toBe(
      'Disconnected'
    );
    expect(renderMultiKueueConnectionStatus({ type: 'Active', status: 'Unknown' })).toBe('Unknown');
    expect(renderMultiKueueConnectionStatus(undefined)).toBe('Unknown');
  });

  it('correctly parses MultiKueueCluster v1beta2 with clusterSource.kubeConfig', () => {
    const rawClusterV1Beta2 = {
      apiVersion: 'kueue.x-k8s.io/v1beta2',
      kind: 'MultiKueueCluster',
      metadata: { name: 'worker-us-east' },
      spec: {
        clusterSource: {
          kubeConfig: {
            location: 'worker-us-east-secret',
            locationType: 'Secret',
          },
        },
      },
      status: {
        conditions: [{ type: 'Active', status: 'True', reason: 'Connected' }],
      },
    };

    const cluster = new MultiKueueCluster(rawClusterV1Beta2 as any);
    expect(cluster.kubeConfigLocation).toBe('worker-us-east-secret');
    expect(cluster.kubeConfigType).toBe('Secret');
    expect(cluster.isConnected).toBe(true);
    expect(cluster.connectionStatus).toBe('Connected');
  });

  it('correctly parses MultiKueueCluster v1beta2 with clusterSource.clusterProfileRef', () => {
    const rawClusterProfile = {
      apiVersion: 'kueue.x-k8s.io/v1beta2',
      kind: 'MultiKueueCluster',
      metadata: { name: 'worker-profile-cluster' },
      spec: {
        clusterSource: {
          clusterProfileRef: {
            name: 'us-west-profile',
          },
        },
      },
      status: {
        conditions: [{ type: 'Active', status: 'Unknown', reason: 'Connecting' }],
      },
    };

    const cluster = new MultiKueueCluster(rawClusterProfile as any);
    expect(cluster.kubeConfigLocation).toBe('us-west-profile');
    expect(cluster.kubeConfigType).toBe('ClusterProfile');
    expect(cluster.isConnected).toBe(false);
    expect(cluster.connectionStatus).toBe('Unknown');
  });

  it('maintains backward compatibility with MultiKueueCluster v1beta1 direct kubeConfig', () => {
    const rawClusterV1Beta1 = {
      apiVersion: 'kueue.x-k8s.io/v1beta1',
      kind: 'MultiKueueCluster',
      metadata: { name: 'legacy-worker' },
      spec: {
        kubeConfig: {
          location: 'legacy-secret',
          locationType: 'Secret',
        },
      },
      status: {
        conditions: [{ type: 'Active', status: 'False', reason: 'Disconnected' }],
      },
    };

    const cluster = new MultiKueueCluster(rawClusterV1Beta1 as any);
    expect(cluster.kubeConfigLocation).toBe('legacy-secret');
    expect(cluster.kubeConfigType).toBe('Secret');
    expect(cluster.isConnected).toBe(false);
    expect(cluster.connectionStatus).toBe('Disconnected');
  });

  it('returns route params for detail page', () => {
    expect(getMultiKueueClusterDetailRouteParams('test-cluster')).toEqual({
      name: 'test-cluster',
    });
    expect(getMultiKueueClusterDetailRouteParams(undefined)).toEqual({
      name: '',
    });
  });
});
