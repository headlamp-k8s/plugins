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

/** Structured payload rendered by MCP output components. */
export interface FormattedMCPData {
  headers?: string[];
  rows?: unknown[][];
  items?: Array<{
    text: string;
    status?: string;
    metadata?: string;
  }>;
  content?: string;
  language?: string;
  [key: string]: unknown;
}

/** AI-formatted representation of raw MCP tool output. */
export interface FormattedMCPOutput {
  type: 'table' | 'metrics' | 'list' | 'graph' | 'text' | 'error' | 'raw';
  title: string;
  summary: string;
  data: FormattedMCPData;
  insights?: string[];
  warnings?: string[];
  actionable_items?: string[];
  metadata?: {
    toolName: string;
    responseSize: number;
    processingTime: number;
    dataPoints?: number;
  };
}
