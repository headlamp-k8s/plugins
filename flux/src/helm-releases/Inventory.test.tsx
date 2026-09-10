import { K8s } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { inventoryNameLink } from './Inventory';

vi.mock('../common/Table', () => ({ default: () => null }));

type HelmItem = Parameters<typeof inventoryNameLink>[0];

function clusterScopedRoleItem(): HelmItem {
  return {
    kind: 'Role',
    groupName: 'iam.aws.upbound.io',
    apiVersion: 'iam.aws.upbound.io/v1beta1',
    metadata: { name: 'some-role', namespace: undefined },
  } as unknown as HelmItem;
}

function namespacedRoleItem(): HelmItem {
  return {
    kind: 'Role',
    groupName: 'rbac.authorization.k8s.io',
    apiVersion: 'rbac.authorization.k8s.io/v1',
    metadata: { name: 'some-role', namespace: 'default' },
  } as unknown as HelmItem;
}

describe('helm-releases inventoryNameLink', () => {
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
