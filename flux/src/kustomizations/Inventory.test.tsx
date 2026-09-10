import { K8s } from '@kinvolk/headlamp-plugin/lib';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { inventoryNameLink } from './Inventory';

vi.mock('../common/Table', () => ({ default: () => null }));

function clusterScopedRoleItem(): KubeObject {
  return {
    kind: 'Role',
    jsonData: {
      apiVersion: 'iam.aws.upbound.io/v1beta1',
      kind: 'Role',
      metadata: { name: 'some-role', creationTimestamp: '2024-01-01T00:00:00Z' },
    },
    metadata: {
      name: 'some-role',
      namespace: undefined,
      creationTimestamp: '2024-01-01T00:00:00Z',
    },
  } as unknown as KubeObject;
}

function namespacedRoleItem(): KubeObject {
  return {
    kind: 'Role',
    jsonData: {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'Role',
      metadata: {
        name: 'some-role',
        namespace: 'default',
        creationTimestamp: '2024-01-01T00:00:00Z',
      },
    },
    metadata: {
      name: 'some-role',
      namespace: 'default',
      creationTimestamp: '2024-01-01T00:00:00Z',
    },
  } as unknown as KubeObject;
}

describe('inventoryNameLink', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/c/test-cluster/');
  });

  it('resolves a colliding Kind to the built-in namespaced class', () => {
    expect(K8s.ResourceClasses['Role'].isNamespaced).toBe(true);
  });

  it('renders the plain name for a cluster-scoped resource with a built-in namespaced Kind', () => {
    expect(inventoryNameLink(clusterScopedRoleItem())).toBe('some-role');
  });

  it('still links a namespaced resource that has a namespace', () => {
    expect(React.isValidElement(inventoryNameLink(namespacedRoleItem()))).toBe(true);
  });
});
