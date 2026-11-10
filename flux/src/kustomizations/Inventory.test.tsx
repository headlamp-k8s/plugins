import { K8s } from '@kinvolk/headlamp-plugin/lib';
import type { KubeObject, KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import * as crdModule from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { cleanup, render } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GetResourcesFromInventory, inventoryNameLink, parseID } from './Inventory';
import { getMatchingResourceClass } from './inventoryResourceClass';

vi.mock('../common/Table', () => ({ default: () => null }));
vi.mock('@kinvolk/headlamp-plugin/lib', async importOriginal => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

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

describe('parseID', () => {
  it('correctly parses a cluster-scoped resource ID with undefined namespace', () => {
    const id = '_helmreleases.helm.toolkit.fluxcd.io_apiextensions.k8s.io_CustomResourceDefinition';
    expect(parseID(id)).toEqual({
      namespace: undefined,
      name: 'helmreleases.helm.toolkit.fluxcd.io',
      group: 'apiextensions.k8s.io',
      kind: 'CustomResourceDefinition',
    });
  });

  it('correctly parses a namespaced resource ID', () => {
    const id = 'flux-system_my-release_helm.toolkit.fluxcd.io_HelmRelease';
    expect(parseID(id)).toEqual({
      namespace: 'flux-system',
      name: 'my-release',
      group: 'helm.toolkit.fluxcd.io',
      kind: 'HelmRelease',
    });
  });

  it('correctly parses cluster-scoped ID with empty group (core Kubernetes resources)', () => {
    const id = '_my-node__Node';
    expect(parseID(id)).toEqual({
      namespace: undefined,
      name: 'my-node',
      group: '',
      kind: 'Node',
    });
  });

  it('correctly parses namespaced ID with empty group (core Kubernetes resources)', () => {
    const id = 'default_my-secret__Secret';
    expect(parseID(id)).toEqual({
      namespace: 'default',
      name: 'my-secret',
      group: '',
      kind: 'Secret',
    });
  });
});

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

  it('renders a Link with routeName crd for a CustomResourceDefinition item', () => {
    const crdItem = {
      kind: 'CustomResourceDefinition',
      jsonData: {
        apiVersion: 'apiextensions.k8s.io/v1',
        kind: 'CustomResourceDefinition',
        metadata: {
          name: 'helmreleases.helm.toolkit.fluxcd.io',
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
      },
      metadata: {
        name: 'helmreleases.helm.toolkit.fluxcd.io',
        creationTimestamp: '2024-01-01T00:00:00Z',
      },
    } as unknown as KubeObject;

    const link = inventoryNameLink(crdItem);
    expect(React.isValidElement(link)).toBe(true);

    const element = link as React.ReactElement<{
      routeName: string;
      params: { name: string };
      children: React.ReactNode;
    }>;
    expect(element.props.routeName).toBe('crd');
    expect(element.props.params).toEqual({
      name: 'helmreleases.helm.toolkit.fluxcd.io',
    });
    expect(element.props.children).toBe('helmreleases.helm.toolkit.fluxcd.io');
  });
});

describe('GetResourcesFromInventory', () => {
  let originalResourceClasses: Record<string, unknown>;

  beforeEach(() => {
    originalResourceClasses = { ...K8s.ResourceClasses };
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();

    for (const key of Object.keys(K8s.ResourceClasses)) {
      if (!(key in originalResourceClasses)) {
        delete (K8s.ResourceClasses as Record<string, unknown>)[key];
      }
    }
    Object.assign(K8s.ResourceClasses, originalResourceClasses);
  });

  it('preserves native CustomResourceDefinition class and invokes its apiGet without calling makeCustomResourceClass', async () => {
    const crdInventory = [
      {
        id: '_helmreleases.helm.toolkit.fluxcd.io_apiextensions.k8s.io_CustomResourceDefinition',
        v: 'v1',
      },
    ];

    const parsed = parseID(crdInventory[0].id);
    expect(parsed.kind).toBe('CustomResourceDefinition');
    expect(parsed.group).toBe('apiextensions.k8s.io');
    expect(parsed.name).toBe('helmreleases.helm.toolkit.fluxcd.io');
    expect(parsed.namespace).toBeUndefined();

    const matchingClass = getMatchingResourceClass(parsed.kind, parsed.group, crdInventory[0].v);
    expect(matchingClass).toBe(K8s.ResourceClasses.CustomResourceDefinition);

    const mockCancel = vi.fn();
    const mockRunner = vi.fn().mockImplementation(() => Promise.resolve(mockCancel));
    const apiGetSpy = vi
      .spyOn(K8s.ResourceClasses.CustomResourceDefinition, 'apiGet')
      .mockImplementation((() => mockRunner) as any);

    const makeCustomResourceClassSpy = vi.spyOn(crdModule, 'makeCustomResourceClass');

    const { unmount } = render(<GetResourcesFromInventory inventory={crdInventory} />);

    expect(apiGetSpy).toHaveBeenCalledWith(
      expect.any(Function),
      'helmreleases.helm.toolkit.fluxcd.io',
      undefined,
      expect.any(Function)
    );
    expect(mockRunner).toHaveBeenCalled();
    expect(makeCustomResourceClassSpy).not.toHaveBeenCalled();

    // Verify native CRD class definition and prototype getters related to crash report
    expect(K8s.ResourceClasses.CustomResourceDefinition.detailsRoute).toBe('crd');
    expect(
      Object.getOwnPropertyDescriptor(
        K8s.ResourceClasses.CustomResourceDefinition.prototype,
        'spec'
      )?.get
    ).toBeDefined();
    expect(
      Object.getOwnPropertyDescriptor(
        K8s.ResourceClasses.CustomResourceDefinition.prototype,
        'plural'
      )?.get
    ).toBeDefined();

    // Verify native class instance behavior: accessing crd.spec.names and crd.plural
    // which caused TypeError: Cannot read properties of undefined (reading 'names') with dynamic class
    const nativeCRDInstance = new K8s.ResourceClasses.CustomResourceDefinition({
      apiVersion: 'apiextensions.k8s.io/v1',
      kind: 'CustomResourceDefinition',
      metadata: { name: 'helmreleases.helm.toolkit.fluxcd.io' },
      spec: {
        group: 'helm.toolkit.fluxcd.io',
        names: {
          plural: 'helmreleases',
          singular: 'helmrelease',
          kind: 'HelmRelease',
        },
        versions: [{ name: 'v2beta1', served: true, storage: true }],
      },
    } as any);

    expect(nativeCRDInstance.spec?.names?.plural).toBe('helmreleases');
    expect(nativeCRDInstance.plural).toBe('helmreleases');

    // Verify cleanup invokes the returned cancel function
    unmount();
    await vi.waitFor(() => {
      expect(mockCancel).toHaveBeenCalled();
    });
  });

  it('falls back to makeCustomResourceClass for unregistered custom resources without contaminating global state', () => {
    const unregisteredInventory = [
      {
        id: 'flux-system_my-release_helm.toolkit.fluxcd.io_HelmRelease',
        v: 'v2beta1',
      },
    ];

    const parsed = parseID(unregisteredInventory[0].id);
    expect(parsed.kind).toBe('HelmRelease');
    expect(parsed.group).toBe('helm.toolkit.fluxcd.io');
    expect(parsed.name).toBe('my-release');
    expect(parsed.namespace).toBe('flux-system');

    const dummyCancel = vi.fn();
    const dummyClass = class DummyHelmRelease {
      static apiGet = vi.fn().mockReturnValue(() => Promise.resolve(dummyCancel));
    };

    const makeCustomResourceClassSpy = vi
      .spyOn(crdModule, 'makeCustomResourceClass')
      .mockReturnValue(dummyClass as any);

    render(<GetResourcesFromInventory inventory={unregisteredInventory} />);

    expect(makeCustomResourceClassSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'HelmRelease',
        singularName: 'HelmRelease',
        pluralName: 'helmreleases',
        isNamespaced: true,
        apiInfo: [{ group: 'helm.toolkit.fluxcd.io', version: 'v2beta1' }],
      })
    );
    expect(dummyClass.apiGet).toHaveBeenCalled();
    expect(dummyClass.apiGet).toHaveBeenCalledWith(
      expect.any(Function),
      'my-release',
      'flux-system',
      expect.any(Function)
    );
  });
});

describe('getMatchingResourceClass', () => {
  describe('native Headlamp resource classes', () => {
    it('returns native CustomResourceDefinition for v1 and v1beta1', () => {
      const crdv1 = getMatchingResourceClass(
        'CustomResourceDefinition',
        'apiextensions.k8s.io',
        'v1'
      );
      expect(crdv1).toBe(K8s.ResourceClasses.CustomResourceDefinition);

      const crdv1beta1 = getMatchingResourceClass(
        'CustomResourceDefinition',
        'apiextensions.k8s.io',
        'v1beta1'
      );
      expect(crdv1beta1).toBe(K8s.ResourceClasses.CustomResourceDefinition);
    });

    it('returns native Pod for core group v1 with empty string or undefined group', () => {
      const podWithEmptyGroup = getMatchingResourceClass('Pod', '', 'v1');
      expect(podWithEmptyGroup).toBe(K8s.ResourceClasses.Pod);

      const podWithUndefinedGroup = getMatchingResourceClass('Pod', undefined, 'v1');
      expect(podWithUndefinedGroup).toBe(K8s.ResourceClasses.Pod);
    });

    it('returns native Service for core group v1', () => {
      const service = getMatchingResourceClass('Service', '', 'v1');
      expect(service).toBe(K8s.ResourceClasses.Service);
    });

    it('returns native Deployment for apps group v1', () => {
      const deployment = getMatchingResourceClass('Deployment', 'apps', 'v1');
      expect(deployment).toBe(K8s.ResourceClasses.Deployment);
    });
  });

  describe('group and version collision handling', () => {
    const fakeRadappApplication = {
      kind: 'Application',
      apiVersion: 'radapp.io/v1alpha3',
      apiEndpoint: {
        apiInfo: [{ group: 'radapp.io', version: 'v1alpha3', resource: 'applications' }],
      },
      apiGet: () => () => {},
    } as unknown as KubeObjectClass;

    let originalApplication: unknown;

    beforeEach(() => {
      originalApplication = (K8s.ResourceClasses as Record<string, unknown>).Application;
      (K8s.ResourceClasses as Record<string, unknown>).Application = fakeRadappApplication;
    });

    afterEach(() => {
      if (originalApplication === undefined) {
        delete (K8s.ResourceClasses as Record<string, unknown>).Application;
      } else {
        (K8s.ResourceClasses as Record<string, unknown>).Application = originalApplication;
      }
    });

    it('does not reuse a registered class when the API group differs (e.g. argoproj.io vs radapp.io)', () => {
      const result = getMatchingResourceClass('Application', 'argoproj.io', 'v1alpha1');
      expect(result).toBeUndefined();
    });

    it('reuses a registered class when kind, group, and version match', () => {
      const result = getMatchingResourceClass('Application', 'radapp.io', 'v1alpha3');
      expect(result).toBe(fakeRadappApplication);
    });
  });

  describe('version mismatch and unregistered resources', () => {
    it('returns undefined when kind and group match but version does not', () => {
      const result = getMatchingResourceClass('Deployment', 'apps', 'v2');
      expect(result).toBeUndefined();
    });

    it('returns undefined for unregistered custom resources to allow dynamic fallback', () => {
      const result = getMatchingResourceClass('HelmRelease', 'helm.toolkit.fluxcd.io', 'v2beta1');
      expect(result).toBeUndefined();
    });
  });
});
