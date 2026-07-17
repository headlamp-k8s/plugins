import type { KubeResourceGraphDefinition } from './resourceGraphDefinition';

/** A composed resource of an RGD, merged from spec.resources and status. */
export interface ComposedResource {
  id: string;
  kind: string;
  apiVersion: string;
  /** True when the resource is a read-only externalRef rather than a template. */
  external: boolean;
  /** IDs of the resources this resource depends on, from kro's static analysis. */
  dependencies: string[];
  /** True when the resource is only created conditionally (includeWhen). */
  conditional: boolean;
}

/**
 * Derive the composed resource list of an RGD.
 *
 * Node identity and kind come from spec.resources[] — kro's
 * status.resources only contains entries that have at least one
 * dependency, so it cannot be used as the node list. Edges come from
 * status.resources[].dependencies (kro publishes them from its static
 * analysis; they are never re-derived here). Ordering follows
 * status.topologicalOrder when present and falls back to spec order,
 * so Inactive RGDs without status still render.
 */
export function getComposedResources(
  rgd: Pick<KubeResourceGraphDefinition, 'spec' | 'status'> | null | undefined
): ComposedResource[] {
  const specResources = rgd?.spec?.resources ?? [];
  const statusResources = rgd?.status?.resources ?? [];
  const topologicalOrder = rgd?.status?.topologicalOrder ?? [];

  const dependenciesById = new Map<string, string[]>(
    statusResources
      .filter(resource => !!resource?.id)
      .map(resource => [
        resource.id,
        (resource.dependencies ?? []).map(dependency => dependency.id).filter(Boolean),
      ])
  );
  const orderIndexById = new Map<string, number>(topologicalOrder.map((id, index) => [id, index]));

  return specResources
    .filter(resource => !!resource?.id)
    .map(resource => ({
      id: resource.id,
      kind: resource.template?.kind ?? resource.externalRef?.kind ?? '-',
      apiVersion: resource.template?.apiVersion ?? resource.externalRef?.apiVersion ?? '-',
      external: !!resource.externalRef,
      dependencies: dependenciesById.get(resource.id) ?? [],
      conditional: (resource.includeWhen ?? []).length > 0,
    }))
    .sort(
      (a, b) =>
        (orderIndexById.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (orderIndexById.get(b.id) ?? Number.MAX_SAFE_INTEGER)
    );
}

/** A flattened SimpleSchema field, e.g. "replicas" -> "integer | default=1". */
export interface SchemaField {
  path: string;
  definition: string;
}

/**
 * Flatten a SimpleSchema object (spec.schema.spec or spec.schema.status)
 * into dot-path rows. Nested objects become "parent.child" paths; leaf
 * values are the SimpleSchema type strings (or CEL expressions for
 * status fields).
 */
export function flattenSimpleSchema(schema: unknown, prefix = ''): SchemaField[] {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return [];
  }
  return Object.entries(schema as Record<string, unknown>).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenSimpleSchema(value, path);
    }
    return [{ path, definition: String(value) }];
  });
}
