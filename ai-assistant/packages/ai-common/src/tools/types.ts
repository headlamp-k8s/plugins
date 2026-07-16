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

/** Describes a tool call requested by the assistant. */
export interface ToolCall {
  /** Unique identifier for this tool call. */
  id: string;
  /** Tool name shown to the user and execution layer. */
  name: string;
  /** Optional human-readable summary of what the tool does. */
  description?: string;
  /** Arguments that should be passed to the tool. */
  arguments: Record<string, unknown>;
  /** Source of the tool implementation. */
  type: 'mcp' | 'regular';
}
