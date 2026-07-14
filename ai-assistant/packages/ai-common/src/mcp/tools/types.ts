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
  description?: string;
  inputSchema?: Record<string, unknown> | null;
}

/** Tool metadata grouped by server and tool name. */
export interface ProcessorToolsConfig {
  [serverName: string]: Record<string, ProcessorToolConfig>;
}

/** JSON Schema fields used when validating and suggesting MCP arguments. */
export interface JSONSchemaProperty {
  type?: string;
  description?: string;
  default?: unknown;
  minimum?: number;
  enum?: unknown[];
  properties?: Record<string, JSONSchemaProperty>;
}

/** Tool argument values keyed by JSON Schema property name. */
export type ArgumentMap = Record<string, unknown>;

/** Describes the subset of MCP tool schema data used for argument processing. */
export interface MCPToolSchema {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, JSONSchemaProperty>;
    required?: string[];
  };
}

/** Supplies conversational context used to suggest or fill MCP arguments. */
export type UserContext = AssistantRequestContext;

/** Captures the result of validating and enriching tool arguments. */
export interface ProcessedArguments {
  original: ArgumentMap;
  processed: ArgumentMap;
  schema: MCPToolSchema | null;
  suggestions: ArgumentMap;
  errors: string[];
  intelligentFills: Record<string, { value: unknown; reason: string; confidence: number }>;
}
