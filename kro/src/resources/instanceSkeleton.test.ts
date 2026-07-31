import { describe, expect, it } from 'vitest';
import { buildInstanceSkeleton } from './instanceSkeleton';

const genAiServiceRgd = {
  spec: {
    schema: {
      apiVersion: 'v1alpha1',
      kind: 'GenAIService',
      spec: {
        name: 'string',
        model: 'string | default="Qwen/Qwen2.5-0.5B-Instruct"',
        replicas: 'integer | default=1',
        monitoring: 'boolean | default=true',
        storageClass: 'string | default=""',
      },
    },
  },
};

const genAiServiceApi = {
  group: 'kro.run',
  version: 'v1alpha1',
  kind: 'GenAIService',
  isNamespaced: true,
};

describe('buildInstanceSkeleton', () => {
  it('builds apiVersion and kind from the discovered CRD info', () => {
    const skeleton = buildInstanceSkeleton(genAiServiceRgd, genAiServiceApi);
    expect(skeleton.apiVersion).toBe('kro.run/v1alpha1');
    expect(skeleton.kind).toBe('GenAIService');
    expect(skeleton.metadata).toEqual({ name: 'example', namespace: 'default' });
  });

  it('prefers the CRD storage version over the version in spec.schema', () => {
    // The RGD's spec.schema says v1alpha1, but the generated CRD has
    // advanced its storage version — instances must be created with the
    // CRD's version.
    const skeleton = buildInstanceSkeleton(genAiServiceRgd, {
      ...genAiServiceApi,
      version: 'v1alpha2',
    });
    expect(skeleton.apiVersion).toBe('kro.run/v1alpha2');
  });

  it('includes only required fields — every field with a default is omitted', () => {
    const skeleton = buildInstanceSkeleton(genAiServiceRgd, genAiServiceApi);
    expect(skeleton.spec).toEqual({ name: 'example' });
  });

  it('uses typed placeholders for required fields', () => {
    const skeleton = buildInstanceSkeleton(
      {
        spec: {
          schema: {
            apiVersion: 'v1alpha1',
            kind: 'Widget',
            spec: {
              title: 'string',
              count: 'integer',
              ratio: 'float',
              enabled: 'boolean',
              tags: '[]string',
            },
          },
        },
      },
      { group: 'kro.run', version: 'v1alpha1', kind: 'Widget', isNamespaced: true }
    );
    expect(skeleton.spec).toEqual({
      title: 'example',
      count: 1,
      ratio: 1,
      enabled: false,
      tags: [],
    });
  });

  it('recurses into nested schemas, keeping only required leaves', () => {
    const skeleton = buildInstanceSkeleton(
      {
        spec: {
          schema: {
            apiVersion: 'v1alpha1',
            kind: 'Widget',
            spec: {
              nested: { required: 'string', optional: 'integer | default=3' },
              allOptional: { value: 'string | default="x"' },
            },
          },
        },
      },
      { group: 'kro.run', version: 'v1alpha1', kind: 'Widget', isNamespaced: true }
    );
    expect(skeleton.spec).toEqual({ nested: { required: 'example' } });
  });

  it('omits namespace for cluster-scoped APIs and honors a custom group', () => {
    const skeleton = buildInstanceSkeleton(
      { spec: { schema: { apiVersion: 'v1', kind: 'Thing', group: 'example.dev', spec: {} } } },
      { group: 'example.dev', version: 'v1', kind: 'Thing', isNamespaced: false }
    );
    expect(skeleton.apiVersion).toBe('example.dev/v1');
    expect(skeleton.metadata).toEqual({ name: 'example' });
    expect(skeleton.spec).toEqual({});
  });
});
