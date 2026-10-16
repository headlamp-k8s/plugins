import yaml from 'js-yaml';

export function yamlToJSON<T = unknown>(yamlObj: string): T {
  const loadedYaml = yaml.loadAll(yamlObj);
  const normalizedObject = {};
  for (const parsedObject of loadedYaml) {
    if (Array.isArray(parsedObject)) {
      for (const object of parsedObject) {
        Object.assign(normalizedObject, object);
      }
    } else {
      Object.assign(normalizedObject, parsedObject);
    }
  }
  return normalizedObject as T;
}

export function jsonToYAML(jsonObj: any) {
  return yaml.dump(jsonObj);
}

function isPlainObject(value: any): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneObject(obj: Record<string, any>): Record<string, any> {
  const clone: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    Object.defineProperty(clone, key, {
      value: obj[key],
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }
  return clone;
}

/**
 * Recursively merges user overrides into base Helm chart values using Helm coalescing semantics.
 * - Nested maps are merged recursively.
 * - Arrays and scalar values from overrides completely replace base values.
 * - Sibling properties in maps are preserved.
 * - A null override deletes the key, matching Helm coalescing semantics.
 * - Own property definition is used to protect against prototype pollution with __proto__ keys.
 */
export function mergeHelmValues(
  base: Record<string, any> = {},
  overrides: Record<string, any> = {}
): Record<string, any> {
  if (!isPlainObject(base)) {
    return isPlainObject(overrides) ? cloneObject(overrides) : overrides;
  }
  if (!isPlainObject(overrides)) {
    return cloneObject(base);
  }

  const result: Record<string, any> = cloneObject(base);

  for (const key of Object.keys(overrides)) {
    const baseVal = Object.prototype.hasOwnProperty.call(result, key) ? result[key] : undefined;
    const overrideVal = overrides[key];

    if (overrideVal === null) {
      delete result[key];
    } else {
      const mergedVal =
        isPlainObject(baseVal) && isPlainObject(overrideVal)
          ? mergeHelmValues(baseVal, overrideVal)
          : overrideVal;

      Object.defineProperty(result, key, {
        value: mergedVal,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  }

  return result;
}
