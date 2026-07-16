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
 * Builds the system and user prompt pair used to ask the model to fill in
 * arguments for a named tool.
 *
 * Schema references and unions are described as objects when no explicit type
 * is available. Nested properties are rendered one level deep.
 *
 * @param toolName - Tool identifier whose arguments the model should prepare.
 * @param toolSchema - Optional input properties and required field names.
 * @param userContext - User message and recent conversation context.
 * @param originalArgs - Existing arguments shown to the model for completion.
 * @returns System instructions and the user request for argument preparation.
 */
export function createArgumentPreparationPrompt(
  toolName: string,
  toolSchema: {
    /** Input schema used to describe available arguments. */
    inputSchema?: {
      /** JSON Schema fields keyed by argument name. */
      properties?: Record<string, unknown>;
      /** Argument names required by the tool. */
      required?: string[];
    };
  },
  userContext: UserContext,
  originalArgs: Record<string, unknown>
): {
  /** System instructions describing schema and type rules. */
  system: string;
  /** User prompt containing request context and current arguments. */
  user: string;
} {
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
 * Namespace, pod/container, and quoted command values can be inferred from the
 * user message. Other values use enum, default, minimum, or type fallbacks.
 *
 * @param fieldName - Argument name used for contextual inference.
 * @param fieldSchema - Schema metadata used to choose a type-appropriate default.
 * @param userContext - User request context used for text inference.
 * @returns An inferred value, a type fallback, or `null` for an unknown type.
 */
export function getIntelligentDefault(
  fieldName: string,
  fieldSchema: {
    /** JSON Schema primitive or container type. */
    type?: string;
    /** Allowed values, whose first entry is preferred for strings. */
    enum?: unknown[];
    /** Explicit schema default. */
    default?: unknown;
    /** Minimum numeric value used when no default exists. */
    minimum?: number;
    /** Presence marker for nested object properties. */
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
