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

import type { AssistantRequestContext } from '../../conversation/context';

/** Persisted MCP tool metadata consumed by argument processing. */
export interface ProcessorToolConfig {
  /** Human-readable tool description loaded from persisted state. */
  description?: string;
  /** JSON input schema loaded from persisted state, when serializable. */
  inputSchema?: Record<string, unknown> | null;
}

/** Tool metadata grouped by server and tool name. */
export interface ProcessorToolsConfig {
  /** Tool metadata keyed first by server name and then tool name. */
  [serverName: string]: Record<string, ProcessorToolConfig>;
}

/** JSON Schema fields used when validating and suggesting MCP arguments. */
export interface JSONSchemaProperty {
  /** JSON Schema primitive or container type. */
  type?: string;
  /** Human-readable argument explanation. */
  description?: string;
  /** Explicit default value supplied by the schema. */
  default?: unknown;
  /** Minimum accepted numeric value. */
  minimum?: number;
  /** Allowed argument values. */
  enum?: unknown[];
  /** Nested object fields keyed by property name. */
  properties?: Record<string, JSONSchemaProperty>;
}

/** Tool argument values keyed by JSON Schema property name. */
export type ArgumentMap = Record<string, unknown>;

/** Describes the subset of MCP tool schema data used for argument processing. */
export interface MCPToolSchema {
  /** Fully qualified MCP tool name. */
  name: string;
  /** Optional tool behavior description. */
  description?: string;
  /** Optional object schema for tool input arguments. */
  inputSchema?: {
    /** Root schema type, normally `object`. */
    type: string;
    /** Argument schemas keyed by field name. */
    properties?: Record<string, JSONSchemaProperty>;
    /** Argument names required for valid execution. */
    required?: string[];
  };
}

/** Supplies conversational context used to suggest or fill MCP arguments. */
export type UserContext = AssistantRequestContext;

/** Captures the result of validating and enriching tool arguments. */
export interface ProcessedArguments {
  /** Argument values supplied before processing. */
  original: ArgumentMap;
  /** Cleaned and enriched argument values. */
  processed: ArgumentMap;
  /** Tool schema used for processing, or `null` when unavailable. */
  schema: MCPToolSchema | null;
  /** Suggested values generated during argument processing. */
  suggestions: ArgumentMap;
  /** Validation and processing error messages. */
  errors: string[];
  /** Context-derived values keyed by the argument field they filled. */
  intelligentFills: Record<
    string,
    {
      /** Value inserted into the processed arguments. */
      value: unknown;
      /** Explanation of the context or fallback used. */
      reason: string;
      /** Confidence score from `0` to `1`. */
      confidence: number;
    }
  >;
}
