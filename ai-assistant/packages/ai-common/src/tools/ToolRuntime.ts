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

/** Structured result returned after a tool executes. */
export interface ToolExecutionResult {
  /** Text content produced by the tool. */
  content: string;
  /** Whether the result should be appended to conversation history. */
  shouldAddToHistory: boolean;
  /** Whether the assistant should process the result in a follow-up turn. */
  shouldProcessFollowUp: boolean;
  /** Optional tool-specific result metadata. */
  metadata?: Record<string, unknown>;
  /** Error indicator or message supplied by the tool. */
  error?: boolean | string;
  /** Whether the result represents an error. */
  isError?: boolean;
  /** Human-readable result or error message. */
  message?: string;
  /** Optional structured result payload. */
  data?: unknown;
  /** Whether the tool operation completed successfully. */
  success?: boolean;
  /** Additional tool-specific result fields. */
  [key: string]: unknown;
}
