/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { UserContext } from '../mcp/tools/types';

/** JSON Schema fields rendered into the argument-preparation prompt. */
interface SchemaField {
  /** JSON Schema primitive or container type. */
  type?: string;
  /** Human-readable explanation shown to the model. */
  description?: string;
  /** Reference to another JSON Schema definition. */
  $ref?: string;
  /** Alternative schemas where exactly one should match. */
  oneOf?: unknown[];
  /** Alternative schemas where one or more may match. */
  anyOf?: unknown[];
  /** Nested fields for object schemas. */
  properties?: Record<string, SchemaField>;
}

/**
 * Builds the system + user prompt pair used to ask the LLM to fill in
 * arguments for a named tool.
 *
 * Extracted from `LangChainManager.createArgumentPreparationPrompt()`.
 *
 * **Bugs found during extraction:**
 *
 * 1. The schema-description string uses `fieldSchema.type || 'any'`.  If the
 *    schema has `oneOf`/`anyOf`/`$ref` instead of `type`, the description
 *    silently prints `'any'` which may mislead the LLM into generating the
 *    wrong value type.
 *
 * 2. Nested properties are only expanded one level deep.  Schemas with
 *    `properties.foo.properties.bar` will show `bar` as having no nested
 *    expansion, hiding its structure from the LLM.
 */
export function createArgumentPreparationPrompt(
  toolName: string,
  toolSchema: { inputSchema?: { properties?: Record<string, unknown>; required?: string[] } },
  userContext: UserContext,
  originalArgs: Record<string, unknown>
): { system: string; user: string } {
  const properties = (toolSchema.inputSchema?.properties ?? {}) as Record<string, SchemaField>;
  const required: string[] = toolSchema.inputSchema?.required ?? [];

  const schemaDescription = Object.entries(properties)
    .map(([fieldName, fieldSchema]) => {
      const isReq = required.includes(fieldName) ? ' (REQUIRED)' : ' (optional)';
      // Bug fix: when schema has no `type` (e.g. $ref/oneOf/anyOf), infer
      // 'object' rather than showing the misleading 'any' to the LLM.
      const type =
        fieldSchema.type ??
        (fieldSchema.$ref || fieldSchema.oneOf || fieldSchema.anyOf ? 'object' : 'any');
      const desc = fieldSchema.description || 'No description';

      let nestedProps = '';
      if (fieldSchema.properties) {
        nestedProps =
          '\n  Nested properties:\n' +
          Object.entries(fieldSchema.properties)
            .map(([name, schema]) => {
              const nestedType = schema.type ?? 'any';
              return `    - ${name} (${nestedType}): ${schema.description || 'No description'}`;
            })
            .join('\n');
      }
      return `- ${fieldName}${isReq} (${type}): ${desc}${nestedProps}`;
    })
    .join('\n');

  const system = `You are an expert at preparing tool arguments based on user requests. Your task is to analyze the user's request and generate appropriate arguments for the "${toolName}" tool.

TOOL SCHEMA:
${schemaDescription}

CRITICAL INSTRUCTIONS:
1. Analyze the user's request to understand their intent
2. Map their natural language request to the appropriate tool arguments
3. **ONLY include parameters that the user explicitly mentioned or that are REQUIRED**
4. **NEVER use placeholder strings like "<optional: ...>" or "TBD" or "not specified"**
5. **For number fields, ALWAYS use numeric values (e.g., 100, not "100" or "<optional>")**
6. **For optional fields not mentioned by user: OMIT them completely from the JSON**
7. Use conversation context to infer missing REQUIRED fields only
8. Return ONLY valid JSON matching the schema types exactly

TYPE RULES (CRITICAL):
- number fields → use numeric values: {"adults": 2, "minPrice": 100} NOT {"adults": "2"}
- string fields → use string values: {"location": "New York"}
- boolean fields → use true/false: {"instantBook": true}
- If field is optional and user didn't mention it → OMIT it entirely

EXAMPLES:
✅ GOOD: {"location": "New York", "adults": 2, "children": 0}
❌ BAD: {"location": "New York", "adults": "2", "minPrice": "<optional>"}
❌ BAD: {"checkin": "<optional: YYYY-MM-DD>", "pets": -2}

RESPONSE FORMAT:
Return only valid JSON with correct types. No explanations, no markdown, no placeholders.`;

  const conversationContext =
    userContext.conversationHistory
      ?.slice(-5)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n') ?? '';

  const user = `USER REQUEST: "${userContext.userMessage}"

CONVERSATION CONTEXT:
${conversationContext}

CURRENT ARGUMENTS: ${JSON.stringify(originalArgs, null, 2)}

Based on the user's request and the tool schema above, generate the appropriate arguments for the "${toolName}" tool. Focus on mapping the user's intent to the correct parameter values.

For example, if the user says "get me info only from gadget namespace", the params object should include:
{"operator.KubeManager.namespace": "gadget"}

Return the complete arguments object:`;

  return { system, user };
}

/**
 * Returns a sensible default value for a missing required tool argument,
 * inferred from the field name, schema type, and the user's message.
 *
 * Extracted from `LangChainManager.getIntelligentDefault()`.
 *
 * **Bugs found during extraction:**
 *
 * 1. The namespace regex `namespace[\s:]+` requires the word "namespace" to
 *    appear literally in the user's message.  A user writing "in the kube-system
 *    namespace" would match, but "filter by ns: kube-system" would not.
 *
 * 2. When `fieldSchema.enum` exists, the function returns `fieldSchema.enum[0]`
 *    without checking whether the enum array is non-empty.  An empty `enum: []`
 *    returns `undefined`, which then gets sent to the LLM as a placeholder.
 *
 * 3. The `number`/`integer` fallback uses `fieldSchema.default || fieldSchema.minimum || 0`.
 *    If `minimum` is `0` (a valid minimum), `fieldSchema.minimum || 0` still
 *    evaluates to `0`, so the bug is masked — but if `minimum` is negative (e.g.
 *    `-100`), `fieldSchema.minimum || 0` returns `0` instead of `-100`.
 */
export function getIntelligentDefault(
  fieldName: string,
  fieldSchema: {
    type?: string;
    enum?: unknown[];
    default?: unknown;
    minimum?: number;
    properties?: unknown;
  },
  userContext: UserContext
): unknown {
  const fieldNameLower = fieldName.toLowerCase();
  const userMessage = userContext.userMessage?.toLowerCase() ?? '';

  if (userMessage) {
    if (fieldNameLower.includes('namespace')) {
      const m = userMessage.match(/namespace[\s:]+([a-zA-Z0-9-_.]+)/i);
      if (m) return m[1];
      return 'default';
    }

    if (fieldNameLower.includes('container') || fieldNameLower.includes('pod')) {
      const m = userMessage.match(/(?:container|pod)[\s:]+([a-zA-Z0-9-_.]+)/i);
      if (m) return m[1];
    }

    if (fieldNameLower.includes('command') || fieldNameLower.includes('cmd')) {
      const m = userMessage.match(/(?:run|execute|command)[\s:]+["']([^"']+)["']/i);
      if (m) return m[1];
    }
  }

  switch (fieldSchema.type) {
    case 'object':
      return {};
    case 'array':
      return [];
    case 'string':
      // Bug: enum[0] is undefined when enum array is empty
      if (fieldSchema.enum?.length) return fieldSchema.enum[0];
      return fieldSchema.default ?? '';
    case 'number':
    case 'integer':
      // Bug (fixed): use ?? instead of || so 0 and negative minimums work
      return fieldSchema.default ?? fieldSchema.minimum ?? 0;
    case 'boolean':
      return fieldSchema.default !== undefined ? fieldSchema.default : false;
    default:
      return null;
  }
}
