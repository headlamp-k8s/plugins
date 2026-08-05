import { describe, expect, it } from 'vitest';
import { flattenSchemaToFields, getValueAtPath, setValueAtPath } from './valuesSchema';

describe('flattenSchemaToFields', () => {
  it('returns an empty list for null or invalid schemas', () => {
    expect(flattenSchemaToFields(null)).toEqual([]);
    expect(flattenSchemaToFields({} as any)).toEqual([]);
    expect(flattenSchemaToFields('nope' as any)).toEqual([]);
  });

  it('extracts primitive fields with metadata', () => {
    const schema = {
      type: 'object',
      required: ['replicaCount'],
      properties: {
        replicaCount: {
          type: 'integer',
          title: 'Replica Count',
          description: 'Number of replicas',
          default: 3,
          minimum: 1,
          maximum: 10,
        },
        enableTLS: { type: 'boolean', default: false },
        name: { type: 'string' },
      },
    };
    const fields = flattenSchemaToFields(schema);
    expect(fields).toHaveLength(3);

    const replicas = fields[0];
    expect(replicas.path).toEqual(['replicaCount']);
    expect(replicas.label).toBe('Replica Count');
    expect(replicas.description).toBe('Number of replicas');
    expect(replicas.type).toBe('integer');
    expect(replicas.defaultValue).toBe(3);
    expect(replicas.required).toBe(true);
    expect(replicas.minimum).toBe(1);
    expect(replicas.maximum).toBe(10);

    expect(fields[1]).toMatchObject({ path: ['enableTLS'], type: 'boolean', required: false });
    expect(fields[2]).toMatchObject({ path: ['name'], label: 'name', type: 'string' });
  });

  it('recurses into nested objects', () => {
    const schema = {
      type: 'object',
      properties: {
        server: {
          type: 'object',
          properties: {
            image: {
              type: 'object',
              properties: {
                tag: { type: 'string' },
              },
            },
          },
        },
      },
    };
    const fields = flattenSchemaToFields(schema);
    expect(fields).toHaveLength(1);
    expect(fields[0].path).toEqual(['server', 'image', 'tag']);
  });

  it('recurses into objects without an explicit type when properties exist', () => {
    const schema = {
      properties: {
        server: {
          properties: {
            name: { type: 'string' },
          },
        },
      },
    };
    const fields = flattenSchemaToFields(schema);
    expect(fields).toHaveLength(1);
    expect(fields[0].path).toEqual(['server', 'name']);
  });

  it('extracts enum fields', () => {
    const schema = {
      properties: {
        pullPolicy: {
          type: 'string',
          enum: ['Always', 'IfNotPresent', 'Never'],
          default: 'IfNotPresent',
        },
      },
    };
    const fields = flattenSchemaToFields(schema);
    expect(fields).toHaveLength(1);
    expect(fields[0].type).toBe('enum');
    expect(fields[0].enumValues).toEqual(['Always', 'IfNotPresent', 'Never']);
    expect(fields[0].defaultValue).toBe('IfNotPresent');
  });

  it('handles nullable union types like ["string", "null"]', () => {
    const schema = {
      properties: {
        priorityClassName: { type: ['string', 'null'] },
      },
    };
    const fields = flattenSchemaToFields(schema);
    expect(fields).toHaveLength(1);
    expect(fields[0].type).toBe('string');
  });

  it('skips arrays and free-form objects', () => {
    const schema = {
      properties: {
        env: { type: 'array' },
        annotations: { type: 'object' },
        extra: {},
      },
    };
    expect(flattenSchemaToFields(schema)).toEqual([]);
  });

  it('caps the number of extracted fields', () => {
    const properties: Record<string, any> = {};
    for (let i = 0; i < 500; i++) {
      properties[`field${i}`] = { type: 'string' };
    }
    const fields = flattenSchemaToFields({ properties });
    expect(fields.length).toBeLessThanOrEqual(200);
  });

  it('stops recursing past the maximum depth', () => {
    // Build a schema nested deeper than the depth limit.
    let leaf: Record<string, any> = { type: 'string' };
    for (let i = 0; i < 10; i++) {
      leaf = { type: 'object', properties: { nested: leaf } };
    }
    const fields = flattenSchemaToFields({ properties: { root: leaf } });
    expect(fields).toEqual([]);
  });
});

describe('getValueAtPath', () => {
  it('reads nested values', () => {
    const values = { server: { image: { tag: 'v1' } } };
    expect(getValueAtPath(values, ['server', 'image', 'tag'])).toBe('v1');
  });

  it('returns undefined for missing paths', () => {
    expect(getValueAtPath({}, ['a', 'b'])).toBeUndefined();
    expect(getValueAtPath(null, ['a'])).toBeUndefined();
    expect(getValueAtPath({ a: 'leaf' }, ['a', 'b'])).toBeUndefined();
  });
});

describe('setValueAtPath', () => {
  it('sets nested values without mutating the original', () => {
    const values = { server: { image: { tag: 'v1' }, name: 'srv' } };
    const result = setValueAtPath(values, ['server', 'image', 'tag'], 'v2');
    expect(result.server.image.tag).toBe('v2');
    expect(result.server.name).toBe('srv');
    expect(values.server.image.tag).toBe('v1');
  });

  it('creates intermediate objects as needed', () => {
    const result = setValueAtPath({}, ['a', 'b', 'c'], 42);
    expect(result).toEqual({ a: { b: { c: 42 } } });
  });

  it('replaces non-object intermediates', () => {
    const result = setValueAtPath({ a: 'scalar' }, ['a', 'b'], 1);
    expect(result).toEqual({ a: { b: 1 } });
  });

  it('handles null values object', () => {
    expect(setValueAtPath(null, ['a'], 1)).toEqual({ a: 1 });
    expect(setValueAtPath(null, [], 1)).toEqual({});
  });
});
