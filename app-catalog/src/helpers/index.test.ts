/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { jsonToYAML, mergeHelmValues } from './index';

describe('mergeHelmValues', () => {
  it('recursively merges nested objects while preserving sibling defaults', () => {
    const base = {
      image: {
        repository: 'nginx',
        tag: 'latest',
        pullPolicy: 'IfNotPresent',
      },
      replicaCount: 1,
    };
    const overrides = {
      image: {
        tag: '1.25.0',
      },
      replicaCount: 3,
    };

    const merged = mergeHelmValues(base, overrides);
    expect(merged).toEqual({
      image: {
        repository: 'nginx',
        tag: '1.25.0',
        pullPolicy: 'IfNotPresent',
      },
      replicaCount: 3,
    });
  });

  it('replaces arrays instead of merging them according to Helm semantics', () => {
    const base = {
      args: ['--debug', '--port=80'],
      hosts: ['example.com'],
    };
    const overrides = {
      args: ['--port=8080'],
    };

    const merged = mergeHelmValues(base, overrides);
    expect(merged).toEqual({
      args: ['--port=8080'],
      hosts: ['example.com'],
    });
  });

  it('replaces nested maps with scalar overrides and vice versa', () => {
    const base = {
      service: { port: 80 },
      logging: 'verbose',
    };
    const overrides = {
      service: 'disabled',
      logging: { level: 'debug' },
    };

    const merged = mergeHelmValues(base, overrides);
    expect(merged).toEqual({
      service: 'disabled',
      logging: { level: 'debug' },
    });
  });

  it('deletes keys overridden with null values when present in base', () => {
    const base = {
      service: { port: 80 },
      replicaCount: 1,
    };
    const overrides = {
      service: null,
    };

    const merged = mergeHelmValues(base, overrides);
    expect(merged).toEqual({
      replicaCount: 1,
    });
    expect('service' in merged).toBe(false);
  });

  it('preserves user-only null values when not present in base defaults', () => {
    const base = {
      service: { port: 80 },
    };
    const overrides = {
      extra: null,
    };

    const merged = mergeHelmValues(base, overrides);
    expect(merged).toEqual({
      service: { port: 80 },
      extra: null,
    });
    expect('extra' in merged).toBe(true);
    expect(merged.extra).toBeNull();
  });

  it('handles empty or missing base and overrides cleanly', () => {
    expect(mergeHelmValues({}, { a: 1 })).toEqual({ a: 1 });
    expect(mergeHelmValues({ a: 1 }, {})).toEqual({ a: 1 });
    expect(mergeHelmValues(undefined as any, { a: 1 })).toEqual({ a: 1 });
    expect(mergeHelmValues({ a: 1 }, undefined as any)).toEqual({ a: 1 });
  });

  it('does not mutate original objects', () => {
    const base = { image: { tag: 'latest' } };
    const overrides = { image: { tag: 'v2' } };

    const merged = mergeHelmValues(base, overrides);
    expect(base.image.tag).toBe('latest');
    expect(overrides.image.tag).toBe('v2');
    expect(merged.image.tag).toBe('v2');
  });

  it('prevents prototype pollution when merging arbitrary __proto__ keys', () => {
    const base = { replicaCount: 1 };
    const overrides = JSON.parse('{"__proto__": {"polluted": true}}');

    const merged = mergeHelmValues(base, overrides);
    expect((Object.prototype as any).polluted).toBeUndefined();
    expect(Object.getPrototypeOf(merged)).toBe(Object.prototype);
    expect(merged.__proto__).toEqual({ polluted: true });
    expect(jsonToYAML(merged)).toContain('__proto__:');
  });

  it('propagates parent global overrides into chart dependencies', () => {
    const defaults = {
      global: { imageRegistry: 'old' },
      worker: {
        global: { imageRegistry: 'old' },
        replicaCount: 2,
      },
    };
    const override = {
      global: { imageRegistry: 'new' },
    };

    const merged = mergeHelmValues(defaults, override, ['worker']);
    expect(merged.global.imageRegistry).toBe('new');
    expect(merged.worker.global.imageRegistry).toBe('new');
    expect(merged.worker.replicaCount).toBe(2);
  });

  it('does not propagate globals into arbitrary maps that are not dependencies', () => {
    const defaults = {
      global: { imageRegistry: 'new' },
      service: {
        port: 80,
      },
      worker: {
        global: { imageRegistry: 'old' },
      },
    };
    const override = {};

    const merged = mergeHelmValues(defaults, override, ['worker']);
    expect(merged.worker.global.imageRegistry).toBe('new');
    expect(merged.service).toEqual({ port: 80 });
    expect(merged.service.global).toBeUndefined();
  });

  it('extracts dependency names and aliases from chart metadata', () => {
    const defaults = {
      global: { env: 'prod' },
      myWorker: {
        global: { env: 'dev' },
      },
    };
    const override = {};
    const chart = {
      metadata: {
        dependencies: [{ name: 'worker', alias: 'myWorker' }],
      },
    };

    const merged = mergeHelmValues(defaults, override, chart);
    expect(merged.myWorker.global.env).toBe('prod');
  });

  it('does not pollute Object.prototype when dependency is named or aliased __proto__', () => {
    const defaults = {
      global: { key: 'polluted' },
    };
    const overrides = {};
    const chart = {
      metadata: {
        dependencies: [{ name: '__proto__' }],
      },
    };

    const merged = mergeHelmValues(defaults, overrides, chart);
    expect((Object.prototype as any).key).toBeUndefined();
    expect((Object.prototype as any).global).toBeUndefined();
    expect(merged.global.key).toBe('polluted');
  });

  it('prefers metadata alias and ignores lock original name when metadata dependencies exist', () => {
    const defaults = {
      global: { env: 'prod' },
      worker: {
        port: 8080,
      },
      myWorker: {
        replicaCount: 2,
      },
    };
    const overrides = {};
    const chart = {
      metadata: {
        dependencies: [{ name: 'worker', alias: 'myWorker' }],
      },
      lock: {
        dependencies: [{ name: 'worker' }],
      },
    };

    const merged = mergeHelmValues(defaults, overrides, chart);
    expect(merged.myWorker.global.env).toBe('prod');
    expect(merged.worker.global).toBeUndefined();
  });

  it('does not mutate input dependency maps when propagating globals', () => {
    const baseDep = { replicaCount: 1 };
    const overrideDep = { tag: 'latest' };
    const defaults = {
      global: { env: 'prod' },
      depA: baseDep,
    };
    const overrides = {
      depB: overrideDep,
    };

    const merged = mergeHelmValues(defaults, overrides, ['depA', 'depB']);
    expect((baseDep as any).global).toBeUndefined();
    expect((overrideDep as any).global).toBeUndefined();
    expect(merged.depA.global.env).toBe('prod');
    expect(merged.depB.global.env).toBe('prod');
  });

  it('creates values scope and propagates globals for active dependency without parent values entry', () => {
    const defaults = {
      image: 'my-app:v1',
    };
    const overrides = {
      global: { imageRegistry: 'quay.io' },
    };
    const dependencies = ['worker'];

    const merged = mergeHelmValues(defaults, overrides, dependencies);
    expect(merged.image).toBe('my-app:v1');
    expect(merged.global.imageRegistry).toBe('quay.io');
    expect(merged.worker).toBeDefined();
    expect(merged.worker.global).toBeDefined();
    expect(merged.worker.global.imageRegistry).toBe('quay.io');
  });

  it('propagates root globals recursively through two-level dependency tree (parent -> worker -> database)', () => {
    const defaults = {
      global: { imageRegistry: 'docker.io', tag: 'latest' },
      worker: {
        replicaCount: 2,
        database: {
          port: 5432,
          global: { imageRegistry: 'docker.io' },
        },
      },
    };
    const overrides = {
      global: { imageRegistry: 'quay.io' },
    };
    const chart = {
      metadata: {
        dependencies: [{ name: 'worker' }],
      },
      dependencies: [
        {
          name: 'worker',
          dependencies: [{ name: 'database' }],
        },
      ],
    };

    const merged = mergeHelmValues(defaults, overrides, chart);
    expect(merged.global.imageRegistry).toBe('quay.io');
    expect(merged.global.tag).toBe('latest');
    expect(merged.worker.global.imageRegistry).toBe('quay.io');
    expect(merged.worker.global.tag).toBe('latest');
    expect(merged.worker.database.global.imageRegistry).toBe('quay.io');
    expect(merged.worker.database.global.tag).toBe('latest');
    expect(merged.worker.database.port).toBe(5432);
  });

  it('resolves metadata.name in array branches across deeper dependency trees (root -> worker -> database -> leaf)', () => {
    const defaults = {
      global: { clusterDomain: 'cluster.local' },
      worker: {
        database: {
          leaf: {
            cacheSize: '256MB',
          },
        },
      },
    };
    const overrides = {
      global: { clusterDomain: 'custom.domain' },
    };
    const chart = {
      metadata: {
        dependencies: [{ name: 'worker' }],
      },
      dependencies: [
        {
          name: 'worker',
          dependencies: [
            {
              metadata: { name: 'database' },
              dependencies: [
                {
                  metadata: { name: 'leaf' },
                },
              ],
            },
          ],
        },
      ],
    };

    const merged = mergeHelmValues(defaults, overrides, chart);
    expect(merged.global.clusterDomain).toBe('custom.domain');
    expect(merged.worker.global.clusterDomain).toBe('custom.domain');
    expect(merged.worker.database.global.clusterDomain).toBe('custom.domain');
    expect(merged.worker.database.leaf.global.clusterDomain).toBe('custom.domain');
    expect(merged.worker.database.leaf.cacheSize).toBe('256MB');
  });

  it('traverses dependencies and propagates globals when only a subchart defines globals', () => {
    const defaults = {
      worker: {
        global: { environment: 'production' },
        database: {
          port: 5432,
        },
      },
    };
    const overrides = {};
    const chart = {
      metadata: {
        dependencies: [{ name: 'worker' }],
      },
      dependencies: [
        {
          name: 'worker',
          dependencies: [{ name: 'database' }],
        },
      ],
    };

    const merged = mergeHelmValues(defaults, overrides, chart);
    expect(merged.global).toBeUndefined();
    expect(merged.worker.global.environment).toBe('production');
    expect(merged.worker.database.global).toBeDefined();
    expect(merged.worker.database.global.environment).toBe('production');
    expect(merged.worker.database.port).toBe(5432);
  });

  it('merges dependency chart defaults stored only in subchart values', () => {
    const defaults = {
      image: 'app:v1',
    };
    const overrides = {
      worker: {
        image: 'worker:custom',
      },
    };
    const chart = {
      metadata: {
        dependencies: [{ name: 'worker' }],
      },
      dependencies: [
        {
          name: 'worker',
          values: {
            replicaCount: 2,
            port: 8080,
          },
        },
      ],
    };

    const merged = mergeHelmValues(defaults, overrides, chart);
    expect(merged.image).toBe('app:v1');
    expect(merged.worker.replicaCount).toBe(2);
    expect(merged.worker.port).toBe(8080);
    expect(merged.worker.image).toBe('worker:custom');
  });
});
