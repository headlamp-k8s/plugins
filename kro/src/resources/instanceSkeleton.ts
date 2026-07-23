import type { InstanceApiInfo } from './instanceApi';
import type { KubeResourceGraphDefinition } from './resourceGraphDefinition';

/**
 * Placeholder for one SimpleSchema leaf, e.g. "integer | default=1".
 * Only fields without a default are considered required.
 */
function placeholderFor(definition: string): unknown {
  const type = definition.split('|')[0].trim();
  switch (type) {
    case 'integer':
      return 1;
    case 'float':
    case 'number':
      return 1;
    case 'boolean':
      return false;
    case 'string':
      return 'example';
    default:
      if (type.startsWith('[]')) {
        return [];
      }
      if (type.startsWith('map[')) {
        return {};
      }
      return 'example';
  }
}

function requiredFieldsOf(schema: unknown): Record<string, unknown> {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return {};
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema as Record<string, unknown>)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = requiredFieldsOf(value);
      if (Object.keys(nested).length > 0) {
        result[key] = nested;
      }
      continue;
    }
    const definition = String(value);
    if (!definition.includes('default=')) {
      result[key] = placeholderFor(definition);
    }
  }
  return result;
}

/**
 * A minimal valid instance for an RGD's generated API: apiVersion and
 * kind from the discovered CRD (the source of truth for the served
 * storage version, which can differ from the version named in
 * spec.schema), a placeholder name/namespace, and every required
 * (default-less) SimpleSchema field with a sensible placeholder value.
 */
export function buildInstanceSkeleton(
  rgd: Pick<KubeResourceGraphDefinition, 'spec'>,
  api: Pick<InstanceApiInfo, 'group' | 'version' | 'kind' | 'isNamespaced'>
): Record<string, unknown> {
  const schema = rgd.spec?.schema ?? {};
  const metadata: Record<string, unknown> = { name: 'example' };
  if (api.isNamespaced) {
    metadata.namespace = 'default';
  }
  return {
    apiVersion: `${api.group}/${api.version}`,
    kind: api.kind,
    metadata,
    spec: requiredFieldsOf(schema.spec),
  };
}
