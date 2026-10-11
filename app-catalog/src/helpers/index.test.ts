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

  it('deletes keys overridden with null values', () => {
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
});
