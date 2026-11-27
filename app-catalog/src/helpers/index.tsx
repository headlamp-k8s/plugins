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

function deepClone<T>(val: T): T {
  if (!isPlainObject(val) && !Array.isArray(val)) {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(item => deepClone(item)) as unknown as T;
  }
  const clone: Record<string, any> = {};
  for (const key of Object.keys(val as Record<string, any>)) {
    Object.defineProperty(clone, key, {
      value: deepClone((val as Record<string, any>)[key]),
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }
  return clone as unknown as T;
}

function applyNullOverrides(
  target: Record<string, any>,
  overrides: Record<string, any>,
  parentDefaults?: Record<string, any>,
  subchartDefaults?: Record<string, any>,
  dependencyContext?: DependencyContext,
  parentGlobal?: Record<string, any>,
  isInsideGlobal: boolean = false,
  inheritedSubmap?: Record<string, any>
) {
  if (!isPlainObject(target) || !isPlainObject(overrides)) return;
  for (const key of Object.keys(overrides)) {
    const hasParentDefault =
      isPlainObject(parentDefaults) && Object.prototype.hasOwnProperty.call(parentDefaults, key);
    const hasSubchartDefault =
      isPlainObject(subchartDefaults) &&
      Object.prototype.hasOwnProperty.call(subchartDefaults, key);
    const matchingDefaultExists = hasParentDefault || hasSubchartDefault;

    const isInheritedGlobal =
      isInsideGlobal &&
      isPlainObject(inheritedSubmap) &&
      Object.prototype.hasOwnProperty.call(inheritedSubmap, key);

    if (overrides[key] === null) {
      if (isInheritedGlobal) {
        // Inherited parent globals must survive null overrides from child charts
        Object.defineProperty(target, key, {
          value: deepClone(inheritedSubmap[key]),
          writable: true,
          enumerable: true,
          configurable: true,
        });
      } else if (matchingDefaultExists) {
        delete target[key];
      } else {
        Object.defineProperty(target, key, {
          value: null,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    } else if (isPlainObject(overrides[key]) && isPlainObject(target[key])) {
      if (isInsideGlobal) {
        const nextInheritedSubmap = isPlainObject(inheritedSubmap?.[key])
          ? inheritedSubmap[key]
          : undefined;
        applyNullOverrides(
          target[key],
          overrides[key],
          hasParentDefault && isPlainObject(parentDefaults[key]) ? parentDefaults[key] : undefined,
          hasSubchartDefault && isPlainObject(subchartDefaults[key])
            ? subchartDefaults[key]
            : undefined,
          undefined,
          parentGlobal,
          true,
          nextInheritedSubmap
        );
      } else if (key === 'global' && isPlainObject(parentGlobal)) {
        applyNullOverrides(
          target[key],
          overrides[key],
          hasParentDefault && isPlainObject(parentDefaults[key]) ? parentDefaults[key] : undefined,
          hasSubchartDefault && isPlainObject(subchartDefaults[key])
            ? subchartDefaults[key]
            : undefined,
          undefined,
          parentGlobal,
          true,
          parentGlobal
        );
      } else {
        const childDepContext = findChildDependencyContext(dependencyContext, key);
        const childChartDefaults = isPlainObject((childDepContext as any)?.values)
          ? (childDepContext as any).values
          : isPlainObject((childDepContext as any)?.chart?.values)
          ? (childDepContext as any).chart.values
          : isPlainObject(subchartDefaults?.[key])
          ? subchartDefaults[key]
          : undefined;

        // Pass the containing chart's computed globals only at declared dependency boundaries.
        // Clear inherited context for ordinary maps so ordinary properties named "global"
        // (such as worker.settings.global) do not inherit Helm global scope.
        const nextParentGlobal = childDepContext
          ? isPlainObject(target.global)
            ? target.global
            : parentGlobal
          : undefined;

        applyNullOverrides(
          target[key],
          overrides[key],
          hasParentDefault && isPlainObject(parentDefaults[key]) ? parentDefaults[key] : undefined,
          childChartDefaults,
          childDepContext,
          nextParentGlobal,
          false,
          undefined
        );
      }
    }
  }
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
          const originalName = typeof item === 'object' && item !== null ? item.name : undefined;
          if (originalName && originalName !== depName && Array.isArray(context.dependencies)) {
            const matchedSubchart = context.dependencies.find(
              sub =>
                typeof sub === 'object' &&
                sub !== null &&
                ((sub as any).metadata?.name === originalName || (sub as any).name === originalName)
            );
            if (matchedSubchart) {
              return resolveChild(matchedSubchart);
            }
          }
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
 * - When dependency context is provided, parent `global` values are propagated into chart
 *   dependencies without propagating globals into arbitrary maps that are not dependencies.
 */
export function mergeHelmValues(
  base: Record<string, any> = {},
  overrides: Record<string, any> = {},
  dependencies?: DependencyContext
): Record<string, any> {
  if (!isPlainObject(base)) {
    return isPlainObject(overrides) ? deepClone(overrides) : overrides;
  }
  if (!isPlainObject(overrides)) {
    return deepClone(base);
  }

  const result: Record<string, any> = deepClone(base);

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
          : isPlainObject(overrideVal) || Array.isArray(overrideVal)
          ? deepClone(overrideVal)
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

      if (Object.prototype.hasOwnProperty.call(overrides, dep) && overrides[dep] === null) {
        continue;
      }

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

      // Skip when the dependency is absent in result and has no parent globals,
      // child defaults, or nested context
      if (!hasDepKey && !hasParentGlobal && !hasChildDefaults && !childContext) {
        continue;
      }

      // Initialize missing scope or clone existing object map
      const depObj: Record<string, any> = isPlainObject(existingVal) ? deepClone(existingVal) : {};

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

      // Coalesce child defaults with parent overrides and recurse into child dependencies
      const coalescedDep = childContext
        ? mergeHelmValues(childDefaults, depObj, childContext)
        : hasChildDefaults
        ? mergeHelmValues(childDefaults, depObj)
        : depObj;

      // Re-apply null overrides from user overrides for this dependency so subchart
      // defaults do not restore keys deleted by null
      if (Object.prototype.hasOwnProperty.call(overrides, dep) && isPlainObject(overrides[dep])) {
        const parentDepDefaults = isPlainObject(base[dep]) ? base[dep] : undefined;
        applyNullOverrides(
          coalescedDep,
          overrides[dep],
          parentDepDefaults,
          hasChildDefaults ? childDefaults : undefined,
          childContext,
          parentGlobal,
          false,
          undefined
        );
      }

      // Preserve the dependency in result only if it existed, inherited parent globals,
      // or resolved non-empty child values
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
