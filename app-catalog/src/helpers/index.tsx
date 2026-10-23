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

export type DependencyContext =
  | string[]
  | Array<{ name?: string; alias?: string }>
  | {
      metadata?: { dependencies?: Array<{ name?: string; alias?: string } | string> };
      dependencies?: Array<
        { name?: string; alias?: string; metadata?: { name?: string; alias?: string } } | string
      >;
      lock?: { dependencies?: Array<{ name?: string; alias?: string } | string> };
      chart?: any;
    };

export function extractDependencyNames(context?: DependencyContext): string[] {
  if (!context) return [];
  const names = new Set<string>();

  const addDep = (item: any) => {
    if (!item) return;
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed) names.add(trimmed);
    } else if (typeof item === 'object') {
      const name = item.alias || item.metadata?.alias || item.metadata?.name || item.name;
      if (typeof name === 'string' && name.trim()) {
        names.add(name.trim());
      }
    }
  };

  if (Array.isArray(context)) {
    for (const item of context) {
      addDep(item);
    }
    return Array.from(names);
  }

  if (typeof context === 'object') {
    if ((context as any).chart) {
      return extractDependencyNames((context as any).chart);
    }
    if (Array.isArray(context.metadata?.dependencies)) {
      for (const item of context.metadata.dependencies) {
        addDep(item);
      }
    }
    if (names.size === 0 && Array.isArray(context.dependencies)) {
      for (const item of context.dependencies) {
        addDep(item);
      }
    }
    if (names.size === 0 && Array.isArray(context.lock?.dependencies)) {
      for (const item of context.lock.dependencies) {
        addDep(item);
      }
    }
  }

  return Array.from(names);
}

/**
 * Recursively merges user overrides into base Helm chart values using Helm coalescing semantics.
 * - Nested maps are merged recursively.
 * - Arrays and scalar values from overrides completely replace base values.
 * - Sibling properties in maps are preserved.
 * - A null override deletes the key, matching Helm coalescing semantics.
 * - Own property definition is used to protect against prototype pollution with __proto__ keys.
 * - When dependency context is provided, parent `global` values are propagated into chart dependencies,
 *   without propagating globals into arbitrary maps that are not dependencies.
 */
export function mergeHelmValues(
  base: Record<string, any> = {},
  overrides: Record<string, any> = {},
  dependencies?: DependencyContext
): Record<string, any> {
  if (!isPlainObject(base)) {
    return isPlainObject(overrides) ? cloneObject(overrides) : overrides;
  }
  if (!isPlainObject(overrides)) {
    return cloneObject(base);
  }

  const result: Record<string, any> = cloneObject(base);

  for (const key of Object.keys(overrides)) {
    const hasBaseKey = Object.prototype.hasOwnProperty.call(result, key);
    const baseVal = hasBaseKey ? result[key] : undefined;
    const overrideVal = overrides[key];

    if (overrideVal === null) {
      if (hasBaseKey) {
        delete result[key];
      } else {
        Object.defineProperty(result, key, {
          value: null,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
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

  // Propagate parent global values into chart dependencies as Helm does
  const depNames = extractDependencyNames(dependencies);
  if (depNames.length > 0 && isPlainObject(result.global)) {
    const parentGlobal = result.global;
    for (const dep of depNames) {
      if (
        dep !== '__proto__' &&
        Object.prototype.hasOwnProperty.call(result, dep) &&
        isPlainObject(result[dep])
      ) {
        const depObj = cloneObject(result[dep]);
        const childGlobal = isPlainObject(depObj.global) ? depObj.global : {};
        const mergedChildGlobal = mergeHelmValues(childGlobal, parentGlobal);
        Object.defineProperty(depObj, 'global', {
          value: mergedChildGlobal,
          writable: true,
          enumerable: true,
          configurable: true,
        });
        Object.defineProperty(result, dep, {
          value: depObj,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    }
  }

  return result;
}
