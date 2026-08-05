/**
 * Helpers to turn a Helm chart's values.schema.json (JSON Schema) into a flat
 * list of primitive form fields that can be rendered as simple form controls.
 *
 * Only primitive leaf properties (string, number, integer, boolean and enums)
 * are extracted; arrays and free-form objects are left to the YAML editor.
 */

export interface SchemaFormField {
  /** Property path in the values object, e.g. ['server', 'image', 'tag']. */
  path: string[];
  /** Human readable label, from the schema title or the last path segment. */
  label: string;
  /** Description from the schema, if any. */
  description?: string;
  /** Primitive field type. */
  type: 'string' | 'number' | 'integer' | 'boolean' | 'enum';
  /** Allowed values when the property declares an enum. */
  enumValues?: any[];
  /** Default value from the schema, if any. */
  defaultValue?: any;
  /** Whether the property is listed in the parent's `required` array. */
  required: boolean;
  /** Minimum/maximum constraints for numeric fields. */
  minimum?: number;
  maximum?: number;
}

// Guard against pathological or deeply nested schemas.
const MAX_DEPTH = 6;
const MAX_FIELDS = 200;

function resolveType(prop: Record<string, any>): string | undefined {
  // "type" may be a string or an array like ["string", "null"].
  if (Array.isArray(prop.type)) {
    return prop.type.find((entry: string) => entry !== 'null');
  }
  return prop.type;
}

/**
 * Flattens a JSON Schema into a list of primitive form fields.
 *
 * @param schema - The parsed values.schema.json object.
 * @returns The list of extracted fields, in schema order.
 */
export function flattenSchemaToFields(schema: Record<string, any> | null): SchemaFormField[] {
  const fields: SchemaFormField[] = [];
  if (!schema || typeof schema !== 'object') {
    return fields;
  }

  function walk(node: Record<string, any>, path: string[], depth: number) {
    if (fields.length >= MAX_FIELDS || depth > MAX_DEPTH) {
      return;
    }
    const properties = node?.properties;
    if (!properties || typeof properties !== 'object') {
      return;
    }
    const required: string[] = Array.isArray(node.required) ? node.required : [];

    for (const [name, rawProp] of Object.entries(properties)) {
      if (fields.length >= MAX_FIELDS) {
        return;
      }
      const prop = rawProp as Record<string, any>;
      if (!prop || typeof prop !== 'object') {
        continue;
      }
      const propPath = [...path, name];
      const type = resolveType(prop);

      if (Array.isArray(prop.enum) && prop.enum.length > 0) {
        fields.push({
          path: propPath,
          label: prop.title || name,
          description: prop.description,
          type: 'enum',
          enumValues: prop.enum,
          defaultValue: prop.default,
          required: required.includes(name),
        });
      } else if (type === 'string' || type === 'number' || type === 'integer') {
        fields.push({
          path: propPath,
          label: prop.title || name,
          description: prop.description,
          type,
          defaultValue: prop.default,
          required: required.includes(name),
          minimum: typeof prop.minimum === 'number' ? prop.minimum : undefined,
          maximum: typeof prop.maximum === 'number' ? prop.maximum : undefined,
        });
      } else if (type === 'boolean') {
        fields.push({
          path: propPath,
          label: prop.title || name,
          description: prop.description,
          type: 'boolean',
          defaultValue: prop.default,
          required: required.includes(name),
        });
      } else if (type === 'object' || (!type && prop.properties)) {
        walk(prop, propPath, depth + 1);
      }
      // Arrays and free-form objects are intentionally skipped; they are
      // better edited directly in the YAML editor.
    }
  }

  walk(schema, [], 0);
  return fields;
}

/**
 * Reads a value at the given path from a nested object.
 */
export function getValueAtPath(values: Record<string, any> | null, path: string[]): any {
  let current: any = values;
  for (const key of path) {
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

/**
 * Returns a copy of `values` with `value` set at the given path, creating
 * intermediate objects as needed. The original object is not mutated.
 */
export function setValueAtPath(
  values: Record<string, any> | null,
  path: string[],
  value: any
): Record<string, any> {
  if (path.length === 0) {
    return values ?? {};
  }
  const root: Record<string, any> = { ...(values ?? {}) };
  let current = root;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const next = current[key];
    current[key] = next && typeof next === 'object' && !Array.isArray(next) ? { ...next } : {};
    current = current[key];
  }
  current[path[path.length - 1]] = value;
  return root;
}
