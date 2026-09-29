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

/**
 * Recursively merges user overrides into base Helm chart values using Helm coalescing semantics.
 * - Nested maps are merged recursively.
 * - Arrays and scalar values from overrides completely replace base values.
 * - Sibling properties in maps are preserved.
 */
export function mergeHelmValues(
  base: Record<string, any> = {},
  overrides: Record<string, any> = {}
): Record<string, any> {
  if (!isPlainObject(base)) {
    return isPlainObject(overrides) ? { ...overrides } : overrides;
  }
  if (!isPlainObject(overrides)) {
    return { ...base };
  }

  const result: Record<string, any> = { ...base };

  for (const key of Object.keys(overrides)) {
    const baseVal = result[key];
    const overrideVal = overrides[key];

    if (isPlainObject(baseVal) && isPlainObject(overrideVal)) {
      result[key] = mergeHelmValues(baseVal, overrideVal);
    } else {
      result[key] = overrideVal;
    }
  }

  return result;
}
