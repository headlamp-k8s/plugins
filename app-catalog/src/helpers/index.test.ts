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

  it('preserves null overrides when parent and subchart defaults overlap', () => {
    const defaults = {
      worker: {
        port: 8080,
        name: 'default-worker',
      },
    };
    const overrides = {
      worker: {
        port: null,
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
            port: 8080,
            threads: 4,
          },
        },
      ],
    };

    const merged = mergeHelmValues(defaults, overrides, chart);
    expect('port' in merged.worker).toBe(false);
    expect(merged.worker.port).toBeUndefined();
    expect(merged.worker.name).toBe('default-worker');
    expect(merged.worker.threads).toBe(4);
  });

  it('preserves user null values and maintains input immutability when dependencies have empty defaults', () => {
    const defaults = {};
    const overrides = {
      worker: {
        extra: {
          keepNull: null,
        },
      },
    };
    const chart = {
      metadata: {
        dependencies: [{ name: 'worker' }],
      },
      dependencies: [
        {
          name: 'worker',
          values: {},
        },
      ],
    };

    const overridesSnapshot = JSON.stringify(overrides);
    const merged = mergeHelmValues(defaults, overrides, chart);

    // Output preservation
    expect('extra' in merged.worker).toBe(true);
    expect('keepNull' in merged.worker.extra).toBe(true);
    expect(merged.worker.extra.keepNull).toBeNull();

    // Input immutability
    expect(JSON.stringify(overrides)).toBe(overridesSnapshot);
    expect('keepNull' in overrides.worker.extra).toBe(true);
    expect(overrides.worker.extra.keepNull).toBeNull();

    // Detached references
    expect(merged.worker).not.toBe(overrides.worker);
    expect(merged.worker.extra).not.toBe(overrides.worker.extra);
  });

  it('deletes null keys only when matching defaults exist and keeps other null overrides', () => {
    const defaults = {
      worker: {
        extra: {
          parentDefault: 'from-parent',
        },
      },
    };
    const overrides = {
      worker: {
        extra: {
          parentDefault: null,
          subchartDefault: null,
          keepNull: null,
        },
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
            extra: {
              subchartDefault: 'from-subchart',
            },
          },
        },
      ],
    };

    const merged = mergeHelmValues(defaults, overrides, chart);

    expect('parentDefault' in merged.worker.extra).toBe(false);
    expect('subchartDefault' in merged.worker.extra).toBe(false);
    expect('keepNull' in merged.worker.extra).toBe(true);
    expect(merged.worker.extra.keepNull).toBeNull();
  });

  it('preserves own __proto__ keys in nested overrides and chart defaults safely without prototype pollution', () => {
    const defaults = {
      nested: JSON.parse('{"__proto__": {"defaultSetting": "default-value"}}'),
    };
    const overrides = {
      nested: JSON.parse('{"__proto__": {"overrideSetting": "override-value"}}'),
    };

    const merged = mergeHelmValues(defaults, overrides);
    expect(Object.prototype.hasOwnProperty.call(merged.nested, '__proto__')).toBe(true);
    expect(merged.nested.__proto__).toEqual({
      defaultSetting: 'default-value',
      overrideSetting: 'override-value',
    });
    expect((Object.prototype as any).overrideSetting).toBeUndefined();
    expect((Object.prototype as any).defaultSetting).toBeUndefined();
    expect(Object.getPrototypeOf(merged.nested)).toBe(Object.prototype);
  });

  it('removes grandchild dependency chart defaults when overridden with null', () => {
    const defaults = {
      worker: {},
    };
    const overrides = {
      worker: {
        database: {
          port: null,
          customNull: null,
        },
      },
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
              name: 'database',
              values: {
                port: 5432,
              },
            },
          ],
          values: {},
        },
      ],
    };

    const merged = mergeHelmValues(defaults, overrides, chart);
    expect('port' in (merged.worker?.database || {})).toBe(false);
    expect('customNull' in (merged.worker?.database || {})).toBe(true);
    expect(merged.worker?.database?.customNull).toBeNull();
  });

  it('preserves inherited parent global values when child specifies null for that global key', () => {
    const defaults = {
      global: { env: 'prod' },
      worker: {},
    };
    const overrides = {
      worker: {
        global: {
          env: null,
          workerOnly: null,
        },
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
            global: {
              env: 'dev',
              workerOnly: 'workerDefault',
            },
          },
        },
      ],
    };

    const merged = mergeHelmValues(defaults, overrides, chart);
    expect(merged.global?.env).toBe('prod');
    expect(merged.worker?.global?.env).toBe('prod');
    expect('workerOnly' in (merged.worker?.global || {})).toBe(false);
  });

  it('deletes child-scoped null overrides instead of overwriting with unrelated parent global keys', () => {
    const defaults = {
      global: { env: 'prod' },
      worker: {
        env: 'parent-worker-env',
      },
    };
    const overrides = {
      worker: {
        env: null,
      },
    };
    const chart = {
      metadata: { dependencies: [{ name: 'worker' }] },
      dependencies: [
        {
          name: 'worker',
          values: {
            env: 'worker-dev',
          },
        },
      ],
    };

    const merged = mergeHelmValues(defaults, overrides, chart);
    expect('env' in (merged.worker || {})).toBe(false);
    expect(merged.global?.env).toBe('prod');
  });

  it('preserves nested inherited parent global values when child overrides nested global keys with null', () => {
    const defaults = {
      global: {
        nested: {
          secret: 'prod-secret',
          app: 'prod-app',
        },
      },
      worker: {},
    };
    const overrides = {
      worker: {
        global: {
          nested: {
            secret: null,
            workerOnly: null,
          },
        },
      },
    };
    const chart = {
      metadata: { dependencies: [{ name: 'worker' }] },
      dependencies: [
        {
          name: 'worker',
          values: {
            global: {
              nested: {
                secret: 'worker-default-secret',
                workerOnly: 'from-worker',
              },
            },
          },
        },
      ],
    };

    const merged = mergeHelmValues(defaults, overrides, chart);
    expect(merged.worker?.global?.nested?.secret).toBe('prod-secret');
    expect(merged.worker?.global?.nested?.app).toBe('prod-app');
    expect('workerOnly' in (merged.worker?.global?.nested || {})).toBe(false);
  });

  it('preserves containing chart globals at declared dependency boundaries when root has no globals', () => {
    const defaults = {
      worker: {
        global: { env: 'prod' },
        database: {
          global: { env: 'prod' },
          port: 5432,
        },
      },
    };
    const overrides = {
      worker: {
        database: {
          global: { env: null },
        },
      },
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
    expect(merged.global).toBeUndefined();
    expect(merged.worker?.global?.env).toBe('prod');
    expect(merged.worker?.database?.global?.env).toBe('prod');
  });

  it('clears inherited global context for ordinary maps such as worker.settings.global and does not inject root globals', () => {
    const defaults = {
      global: { clusterDomain: 'cluster.local', rootEnv: 'prod' },
      worker: {
        settings: {
          global: { env: 'dev' },
        },
      },
    };
    const overrides = {
      worker: {
        settings: {
          global: { env: null },
        },
      },
    };
    const chart = {
      metadata: {
        dependencies: [{ name: 'worker' }],
      },
      dependencies: [
        {
          name: 'worker',
        },
      ],
    };

    const merged = mergeHelmValues(defaults, overrides, chart);
    expect(merged.global?.clusterDomain).toBe('cluster.local');
    expect(merged.worker?.global?.clusterDomain).toBe('cluster.local');
    expect(merged.worker?.settings?.global?.clusterDomain).toBeUndefined();
    expect(merged.worker?.settings?.global?.rootEnv).toBeUndefined();
    expect('env' in (merged.worker?.settings?.global || {})).toBe(false);
  });

  it('removes worker.global key overridden with null when both parent and subchart defaults define it without root globals', () => {
    const defaults = {
      worker: {
        global: { env: 'dev' },
      },
    };
    const overrides = {
      worker: {
        global: { env: null },
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
            global: { env: 'dev' },
          },
        },
      ],
    };

    const merged = mergeHelmValues(defaults, overrides, chart);
    expect(merged.global).toBeUndefined();
    expect('env' in (merged.worker?.global || {})).toBe(false);
  });

  it('does not resurrect a dependency deleted with null even when parent globals or child defaults exist', () => {
    const defaults = {
      global: { env: 'prod' },
      worker: { replicaCount: 1 },
    };
    const overrides = {
      worker: null,
    };
    const chart = {
      metadata: { dependencies: [{ name: 'worker' }] },
      dependencies: [{ name: 'worker', values: { replicaCount: 2 } }],
    };

    const merged = mergeHelmValues(defaults, overrides, chart);
    expect('worker' in merged).toBe(false);
  });

  it('resolves aliased subchart values when alias is only declared on metadata.dependencies', () => {
    const defaults = {
      global: { env: 'prod' },
    };
    const overrides = {
      myWorker: { replicaCount: 3 },
    };
    const chart = {
      metadata: {
        dependencies: [{ name: 'worker', alias: 'myWorker' }],
      },
      dependencies: [
        {
          metadata: { name: 'worker' },
          values: { replicaCount: 1, port: 8080 },
        },
      ],
    };

    const merged = mergeHelmValues(defaults, overrides, chart);
    expect(merged.myWorker?.replicaCount).toBe(3);
    expect(merged.myWorker?.port).toBe(8080);
    expect(merged.myWorker?.global?.env).toBe('prod');
  });
});
