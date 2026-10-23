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
 * Resolves the nested dependency context for a specific child dependency from its parent context.
 *
 * Supports Helm chart formats (subcharts array in `dependencies`, `metadata.dependencies`,
 * direct dependency arrays, and delegated `chart` wrappers).
 *
 * @param context - Parent chart or dependency context.
 * @param depName - Target child dependency name or alias.
 * @returns The resolved dependency context for the child, or undefined if not specified.
 */
export function findChildDependencyContext(
  context?: DependencyContext,
  depName?: string
): DependencyContext | undefined {
  if (!context || !depName) return undefined;

  const matchesDep = (item: any) => {
    if (typeof item !== 'object' || item === null) return false;
    const name = item.alias || item.metadata?.alias || item.metadata?.name || item.name;
    return name === depName;
  };

  const resolveChild = (item: any) => {
    return (item as any).chart || item;
  };

  if (Array.isArray(context)) {
    for (const item of context) {
      if (matchesDep(item)) {
        return resolveChild(item);
      }
    }
    return undefined;
  }

  if (typeof context === 'object') {
    if ((context as any).chart) {
      return findChildDependencyContext((context as any).chart, depName);
    }

    if (Array.isArray(context.dependencies)) {
      for (const item of context.dependencies) {
        if (matchesDep(item)) {
          return resolveChild(item);
        }
      }
    }

    if (Array.isArray(context.metadata?.dependencies)) {
      for (const item of context.metadata.dependencies) {
        if (matchesDep(item)) {
          return resolveChild(item);
        }
      }
    }

    if (Array.isArray(context.lock?.dependencies)) {
      for (const item of context.lock.dependencies) {
        if (matchesDep(item)) {
          return resolveChild(item);
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(context, depName)) {
      const keyed = (context as any)[depName];
      if (typeof keyed === 'object' && keyed !== null) {
        return keyed;
      }
    }
  }

  return undefined;
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
  if (depNames.length > 0) {
    const parentGlobal = isPlainObject(result.global) ? result.global : {};
    const hasParentGlobal = Object.keys(parentGlobal).length > 0;

    for (const dep of depNames) {
      if (dep === '__proto__') continue;

      const hasDepKey = Object.prototype.hasOwnProperty.call(result, dep);
      const existingVal = hasDepKey ? result[dep] : undefined;

      // If the dependency exists but is a primitive (not an object), do not overwrite with map
      if (hasDepKey && !isPlainObject(existingVal)) {
        continue;
      }

      const childContext = findChildDependencyContext(dependencies, dep);
      const childDefaults = isPlainObject((childContext as any)?.values)
        ? (childContext as any).values
        : isPlainObject((childContext as any)?.chart?.values)
        ? (childContext as any).chart.values
        : {};
      const hasChildDefaults = Object.keys(childDefaults).length > 0;

      // If the dependency is not in result, and parent has no globals, and child has no defaults or context, skip
      if (!hasDepKey && !hasParentGlobal && !hasChildDefaults && !childContext) {
        continue;
      }

      // Initialize missing scope or clone existing object map
      const depObj: Record<string, any> = isPlainObject(existingVal)
        ? cloneObject(existingVal)
        : {};

      if (hasParentGlobal || isPlainObject(depObj.global)) {
        const childGlobal = isPlainObject(depObj.global) ? depObj.global : {};
        const mergedChildGlobal = mergeHelmValues(childGlobal, parentGlobal);
        Object.defineProperty(depObj, 'global', {
          value: mergedChildGlobal,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }

      // Coalesce child chart defaults with parent overrides and recursively propagate into child dependencies
      const coalescedDep = childContext
        ? mergeHelmValues(childDefaults, depObj, childContext)
        : hasChildDefaults
        ? mergeHelmValues(childDefaults, depObj)
        : depObj;

      // Only set in result if the dependency already existed, or parent globals were propagated, or child has values
      if (hasDepKey || hasParentGlobal || Object.keys(coalescedDep).length > 0) {
        Object.defineProperty(result, dep, {
          value: coalescedDep,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    }
  }

  return result;
}
