import { describe, expect, it } from 'vitest';
import { KubeResourceGraphDefinition } from './resourceGraphDefinition';
import { flattenSimpleSchema, getComposedResources } from './rgdGraph';

type RgdData = Pick<KubeResourceGraphDefinition, 'spec' | 'status'>;

const activeRgd: RgdData = {
  spec: {
    schema: { apiVersion: 'v1alpha1', kind: 'GenAIService' },
    resources: [
      {
        id: 'platformConfig',
        externalRef: { apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: 'cfg' } },
      },
      {
        id: 'cache',
        includeWhen: ['${schema.spec.storageClass == ""}'],
        template: { apiVersion: 'v1', kind: 'PersistentVolumeClaim' },
      },
      { id: 'deployment', template: { apiVersion: 'apps/v1', kind: 'Deployment' } },
      { id: 'service', template: { apiVersion: 'v1', kind: 'Service' } },
    ],
  },
  status: {
    state: 'Active',
    // kro omits entries without dependencies; only cache has one here.
    resources: [{ id: 'cache', dependencies: [{ id: 'platformConfig' }] }],
    // Deliberately not in spec order to prove ordering comes from here.
    topologicalOrder: ['platformConfig', 'deployment', 'cache', 'service'],
  },
};

describe('getComposedResources', () => {
  it('lists every spec resource, ordered by status.topologicalOrder', () => {
    const resources = getComposedResources(activeRgd);
    expect(resources.map(resource => resource.id)).toEqual([
      'platformConfig',
      'deployment',
      'cache',
      'service',
    ]);
  });

  it('derives kind and apiVersion from templates and externalRefs', () => {
    const byId = new Map(getComposedResources(activeRgd).map(r => [r.id, r]));
    expect(byId.get('deployment')).toMatchObject({ kind: 'Deployment', apiVersion: 'apps/v1' });
    expect(byId.get('platformConfig')).toMatchObject({
      kind: 'ConfigMap',
      apiVersion: 'v1',
      external: true,
    });
    expect(byId.get('cache')).toMatchObject({ external: false, conditional: true });
  });

  it('maps dependency edges from status.resources, defaulting to none', () => {
    const byId = new Map(getComposedResources(activeRgd).map(r => [r.id, r]));
    expect(byId.get('cache')?.dependencies).toEqual(['platformConfig']);
    expect(byId.get('deployment')?.dependencies).toEqual([]);
    expect(byId.get('platformConfig')?.dependencies).toEqual([]);
  });

  it('falls back to spec order when status is missing (Inactive RGD)', () => {
    const inactive: RgdData = { spec: activeRgd.spec, status: undefined };
    const resources = getComposedResources(inactive);
    expect(resources.map(resource => resource.id)).toEqual([
      'platformConfig',
      'cache',
      'deployment',
      'service',
    ]);
    expect(resources.every(resource => resource.dependencies.length === 0)).toBe(true);
  });

  it('returns empty for missing or empty specs', () => {
    expect(getComposedResources(undefined)).toEqual([]);
    expect(getComposedResources({ spec: {} })).toEqual([]);
  });
});

describe('flattenSimpleSchema', () => {
  it('flattens nested fields into dot paths', () => {
    const fields = flattenSimpleSchema({
      name: 'string',
      resources: { cpu: 'string | default="1"', memory: 'string | default="1Gi"' },
    });
    expect(fields).toEqual([
      { path: 'name', definition: 'string' },
      { path: 'resources.cpu', definition: 'string | default="1"' },
      { path: 'resources.memory', definition: 'string | default="1Gi"' },
    ]);
  });

  it('is safe on non-object inputs', () => {
    expect(flattenSimpleSchema(undefined)).toEqual([]);
    expect(flattenSimpleSchema('string')).toEqual([]);
    expect(flattenSimpleSchema(['a'])).toEqual([]);
  });
});
