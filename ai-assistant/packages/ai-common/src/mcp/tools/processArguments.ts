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

import type {
  ArgumentMap,
  JSONSchemaProperty,
  MCPToolSchema,
  ProcessedArguments,
  UserContext,
} from './types';

export function getEmptyValueForRequiredField(fieldSchema: JSONSchemaProperty): unknown {
  switch (fieldSchema.type) {
    case 'object':
      return {};
    case 'array':
      return [];
    case 'string':
      return fieldSchema.default || '';
    case 'number':
    case 'integer':
      return fieldSchema.default || fieldSchema.minimum || 0;
    case 'boolean':
      return fieldSchema.default !== undefined ? fieldSchema.default : false;
    default:
      return null;
  }
}

export function suggestStringValue(
  propertyName: string,
  description: string,
  schema: JSONSchemaProperty
): string | undefined {
  const lowerName = propertyName.toLowerCase();
  const lowerDescription = description.toLowerCase();
  if (schema.enum && Array.isArray(schema.enum)) {
    const firstValue = schema.enum[0];
    return typeof firstValue === 'string' ? firstValue : undefined;
  }
  if (lowerName.includes('path') || lowerName.includes('directory') || lowerName.includes('dir')) {
    if (lowerDescription.includes('current') || lowerDescription.includes('working')) return '.';
    if (lowerDescription.includes('home')) return '~';
    return undefined;
  }
  if (lowerName.includes('file') || lowerName.includes('filename')) return '';
  if (lowerName.includes('name') && !lowerName.includes('filename')) return '';
  if (lowerName.includes('command') || lowerName.includes('cmd')) return '';
  if (lowerName.includes('query') || lowerName.includes('search')) return '';
  return undefined;
}

export function suggestNumberValue(
  propertyName: string,
  _description: string,
  schema: JSONSchemaProperty
): number | undefined {
  const lowerName = propertyName.toLowerCase();
  if (schema.default !== undefined) {
    return typeof schema.default === 'number' ? schema.default : undefined;
  }
  if (schema.minimum !== undefined) return schema.minimum;
  if (lowerName.includes('port')) return 8080;
  if (lowerName.includes('timeout')) return 30;
  if (lowerName.includes('limit') || lowerName.includes('max')) return 100;
  if (lowerName.includes('count')) return 10;
  return undefined;
}

export function suggestBooleanValue(propertyName: string): boolean | undefined {
  const lowerName = propertyName.toLowerCase();
  if (lowerName.includes('enable') || lowerName.includes('enabled')) return false;
  if (lowerName.includes('disable') || lowerName.includes('disabled')) return false;
  if (lowerName.includes('recursive') || lowerName.includes('recurse')) return false;
  if (lowerName.includes('force')) return false;
  if (lowerName.includes('verbose')) return false;
  return undefined;
}

export function suggestArrayValue(): unknown[] {
  return [];
}

export function suggestObjectValue(): ArgumentMap {
  return {};
}

export function generatePropertySuggestion(
  propertyName: string,
  propertySchema: JSONSchemaProperty,
  userContext?: UserContext
): unknown {
  if (userContext?.kubernetesContext) {
    const kubernetesContext = userContext.kubernetesContext;
    if (propertyName.toLowerCase().includes('namespace') && kubernetesContext.namespace) {
      return kubernetesContext.namespace;
    }
    if (
      propertyName.toLowerCase().includes('cluster') &&
      kubernetesContext.selectedClusters?.length
    ) {
      return kubernetesContext.selectedClusters[0];
    }
  }
  if (userContext?.lastToolResults) {
    const lowerPropertyName = propertyName.toLowerCase();
    for (const [contextKey, contextValue] of Object.entries(userContext.lastToolResults)) {
      if (
        contextKey.toLowerCase().includes(lowerPropertyName) ||
        lowerPropertyName.includes(contextKey.toLowerCase())
      ) {
        return contextValue;
      }
    }
  }
  const description = propertySchema.description?.toLowerCase() || '';
  switch (propertySchema.type) {
    case 'string':
      return suggestStringValue(propertyName, description, propertySchema);
    case 'number':
    case 'integer':
      return suggestNumberValue(propertyName, description, propertySchema);
    case 'boolean':
      return suggestBooleanValue(propertyName);
    case 'array':
      return suggestArrayValue();
    case 'object':
      return suggestObjectValue();
    default:
      return undefined;
  }
}

export function generateIntelligentSuggestions(
  schema: MCPToolSchema,
  userContext?: UserContext
): ArgumentMap {
  const suggestions: ArgumentMap = {};
  if (!schema.inputSchema?.properties) return suggestions;
  for (const [key, propertySchema] of Object.entries(schema.inputSchema.properties)) {
    const suggestion = generatePropertySuggestion(key, propertySchema, userContext);
    if (suggestion !== undefined) suggestions[key] = suggestion;
  }
  return suggestions;
}

export function hasActualValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

export function cleanupArguments(args: ArgumentMap, schema: MCPToolSchema): ArgumentMap {
  if (!schema.inputSchema) return args;
  const cleaned: ArgumentMap = {};
  const required = schema.inputSchema.required || [];
  const properties = schema.inputSchema.properties || {};
  for (const [key, value] of Object.entries(args)) {
    if (key === '_llmEnhanced') continue;
    const hasDefault = properties[key]?.default !== undefined;
    if (required.includes(key) || hasActualValue(value) || hasDefault) cleaned[key] = value;
  }
  return cleaned;
}

export function validateArgumentsWithEmptyObjectSupport(
  args: ArgumentMap,
  schema: MCPToolSchema
): string[] {
  const errors: string[] = [];
  if (!schema.inputSchema) return errors;
  const required = schema.inputSchema.required || [];
  const properties = schema.inputSchema.properties || {};
  for (const requiredField of required) {
    if (
      !(requiredField in args) ||
      args[requiredField] === undefined ||
      args[requiredField] === null
    ) {
      errors.push(`Required field '${requiredField}' is missing`);
    }
  }
  for (const [key, value] of Object.entries(args)) {
    if (properties[key] && value !== undefined && value !== null) {
      const expectedType = properties[key].type;
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      const typeMatches =
        expectedType === 'integer'
          ? typeof value === 'number' && Number.isInteger(value)
          : actualType === expectedType;
      if (expectedType && !typeMatches) {
        errors.push(`Field '${key}' should be ${expectedType}, got ${actualType}`);
      }
    }
  }
  return errors;
}

export function processArguments(
  toolName: string,
  aiProcessedArgs: ArgumentMap,
  schema: MCPToolSchema | null,
  userContext?: UserContext
): ProcessedArguments {
  const errors: string[] = [];
  const processed = { ...aiProcessedArgs };
  const intelligentFills: ProcessedArguments['intelligentFills'] = {};
  const llmEnhanced = aiProcessedArgs._llmEnhanced;
  if (typeof llmEnhanced === 'object' && llmEnhanced !== null) {
    delete processed._llmEnhanced;
    const enhancedFields =
      'enhancedFields' in llmEnhanced && Array.isArray(llmEnhanced.enhancedFields)
        ? llmEnhanced.enhancedFields.filter(
            (fieldName): fieldName is string => typeof fieldName === 'string'
          )
        : [];
    for (const fieldName of enhancedFields) {
      if (fieldName in processed) {
        intelligentFills[fieldName] = {
          value: processed[fieldName],
          reason: 'AI-enhanced based on user request analysis',
          confidence: 0.9,
        };
      }
    }
  }
  if (!schema) {
    errors.push(`No schema found for tool: ${toolName}`);
    return {
      original: aiProcessedArgs,
      processed,
      schema: null,
      suggestions: {},
      errors,
      intelligentFills,
    };
  }
  for (const requiredField of schema.inputSchema?.required || []) {
    if (!(requiredField in processed) || processed[requiredField] === undefined) {
      const fieldSchema = schema.inputSchema?.properties?.[requiredField];
      if (fieldSchema) {
        processed[requiredField] = getEmptyValueForRequiredField(fieldSchema);
        if (!intelligentFills[requiredField]) {
          intelligentFills[requiredField] = {
            value: processed[requiredField],
            reason: `Required field provided with empty ${fieldSchema.type}`,
            confidence: 0.8,
          };
        }
      }
    }
  }
  errors.push(...validateArgumentsWithEmptyObjectSupport(processed, schema));
  return {
    original: aiProcessedArgs,
    processed,
    schema,
    suggestions: generateIntelligentSuggestions(schema, userContext),
    errors,
    intelligentFills,
  };
}
